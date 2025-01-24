import type { SubstrateEvent } from "@subql/types";
import { Attestation, Did } from "../../types";
import assert from "assert";
import { saveBlock } from "../blocks/saveBlock";
import { handleCTypeAggregations } from "../cTypes/cTypeHandlers";
import { countEntitiesByFields } from "../utils/countEntitiesByFields";

export async function handleAttestationCreated(
  event: SubstrateEvent
): Promise<void> {
  // A new attestation has been created.\[attester DID, claim hash, CType hash, (optional) delegation ID\]
  const {
    block,
    event: {
      data: [attesterDID, claimHash, cTypeHash, delegationID],
      // data: { attester: attesterDID, claim_hash: claimHash, ctype_hash: cTypeHash, authorization: delegationID },
    },
  } = event;

  logger.info(`New attestation created at block ${block.block.header.number}`);

  // idx describes the type of event, not the count:
  // Ex.: idx= 0x3e00 = 64:00 = Attestation Pallet: 0th Event (att. created)

  // phase.applyExtrinsic is a counter but just for the extrinsic, not the event

  logger.trace(
    `The whole AttestationCreated event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const cTypeId = "kilt:ctype:" + cTypeHash.toHex();
  const payer = event.extrinsic!.extrinsic.signer.toString();
  const issuerId = "did:kilt:" + attesterDID.toString();

  const issuerDID = await Did.get(issuerId);
  assert(issuerDID, `Can't find this DID on the data base: ${issuerId}.`);

  // craft my event ordinal index:
  const numberOfPreviousAttestationsOnSameBlock =
    await countEntitiesByFields<Attestation>("Attestation", [
      ["creationBlockId", "=", blockNumber],
    ]);
  /** Only counts the number of attestations created on one block.
   * It will not match with the event index from subscan that count all kinds of events.
   */
  const eventIndex = numberOfPreviousAttestationsOnSameBlock + 1;

  // unpack delegation, which has changed between runtimes
  // old runtime: "type_name":"Option<DelegationNodeIdOf>" --> was never used XD
  // new runtime: "type_name":"Option<AuthorizationIdOf>" --> value is nested
  let delegation: typeof delegationID | undefined = delegationID;
  delegation = (delegation as any).unwrapOr(undefined);
  // later delegation ids are wrapped in an enum
  if (delegation?.toRawType().startsWith('{"_enum":')) {
    delegation = (delegation as any).value;
  }

  // Make sure that any other attestations of same hash have been previously removed
  const stillExistingAttestations = await Attestation.getByFields(
    [
      ["claimHash", "=", claimHash.toHex()],
      ["removalBlockId", "=", undefined],
    ],
    { limit: 100 }
  );

  // Some extra logs for the debugging mode. Could be useful for chain development as well.
  logger.trace(
    `printing the Attestations with the same hash that have not been removed:`
  );
  stillExistingAttestations.forEach((ownership, index) => {
    logger.trace(
      `Index: ${index}, Attestation: ${JSON.stringify(ownership, null, 2)}`
    );
  });

  assert(
    stillExistingAttestations.length == 0,
    `Can't save attestation ${claimHash} because it is still registered as existing on chain state.`
  );

  const newAttestation = Attestation.create({
    id: `${blockNumber}-${eventIndex}`,
    claimHash: claimHash.toHex(),
    cTypeId: cTypeId,
    issuerId: issuerId,
    payer: payer,
    valid: true,
    creationBlockId: blockNumber,
    delegationID: delegation?.toHex(),
  });

  await newAttestation.save();
  await handleCTypeAggregations(newAttestation, "CREATED");
}

export async function handleAttestationRevoked(
  event: SubstrateEvent
): Promise<void> {
  // An attestation has been revoked.\[attester DID, claim hash\]
  const {
    block,
    event: {
      data: [attesterDID, claimHash],
      // data: { attester: attesterDID, claim_hash: claimHash, ctype_hash: cTypeHash, authorized_by: authorizer },
    },
  } = event;

  logger.info(`Attestation revoked at block ${block.block.header.number}`);

  logger.trace(
    `The whole AttestationRevoked event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  // There could be several attestations with the same claim hash.
  // Given that the older ones has been previously removed from the chain state
  // But only one should be valid

  // Get the attestation that is still valid
  const attestations = await Attestation.getByFields(
    [
      ["claimHash", "=", claimHash.toHex()],
      ["valid", "=", true],
    ],
    { limit: 100 }
  );
  assert(
    attestations.length < 2,
    `Found more the one valid attestation with Claim hash: ${claimHash}.`
  );

  const attestation = attestations[0];
  assert(attestation, `Can't find attestation of Claim hash: ${claimHash}.`);

  attestation.revocationBlockId = await saveBlock(block);
  attestation.valid = false;

  await attestation.save();

  await handleCTypeAggregations(attestation, "REVOKED");
}

export async function handleAttestationRemoved(
  event: SubstrateEvent
): Promise<void> {
  // An attestation has been removed.\[attester DID, claim hash\]
  const {
    block,
    event: {
      data: [attesterDID, claimHash],
      // data: { attester: attesterDID, claim_hash: claimHash, ctype_hash: cTypeHash, authorized_by: authorizer },
    },
  } = event;

  logger.info(`Attestation removed at block ${block.block.header.number}`);

  logger.trace(
    `The whole AttestationRemoved event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  // Find the attestation of this claim hash that has not been removed yet.
  // There should only be one in the data base.
  const attestations = await Attestation.getByFields(
    [["claimHash", "=", claimHash.toHex()]],
    { limit: 100 }
  );
  // TODO: change getter options to the ones below and delete assertion about matching array length
  // { limit: 1, orderBy: "creationBlockId", orderDirection: "DESC" } // Only after using normalized block ID (currently a Pull Request)

  assert(
    attestations.length < 100,
    "A very unlikely case happen. There are more than 100 attestations with the same claim hash. You need to write code to handle it."
  );

  const attestation = attestations.find((atty) => atty.removalBlockId == null);
  assert(
    attestation,
    `Can't find unremoved attestation of Claim hash: ${claimHash}.`
  );

  attestation.removalBlockId = await saveBlock(block);
  attestation.valid = false;

  await attestation.save();

  await handleCTypeAggregations(attestation, "REMOVED");
}

export async function handleAttestationDepositReclaimed(
  event: SubstrateEvent
): Promise<void> {
  // "The deposit owner reclaimed a deposit by removing an attestation." [account id, claim hash]
  // Attestation removed by owner reclaiming his deposit. [account id, claim hash] (rephrased by me)

  // The new runtime (1.15) does not emit "DepositReclaimed" events anymore.
  // In case of a deposit being reclaimed, an "AttestationRemoved" event will be emitted, and if it was still valid, it will be preceded by an "AttestationRevoked" event.
  const {
    block,
    event: {
      data: [accountID, claimHash],
    },
  } = event;

  logger.info(
    `Attestation-Deposit reclaimed at block ${block.block.header.number}`
  );

  logger.trace(
    `The whole AttestationDepositReclaimed event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  // Find the attestation of this claim hash that has not been removed yet.
  // There should only be one in the data base.
  const attestations = await Attestation.getByFields(
    [["claimHash", "=", claimHash.toHex()]],
    { limit: 100 }
  );
  // TODO: change getter options to the ones below and delete assertion about matching array length
  // { limit: 1, orderBy: "creationBlockId", orderDirection: "DESC" } // Only after using normalized block ID (currently a Pull Request)

  assert(
    attestations.length < 100,
    "A very unlikely case happen. There are more than 100 attestations with the same claim hash. You need to write code to handle it."
  );

  const attestation = attestations.find((atty) => atty.removalBlockId == null);

  assert(
    attestation,
    `Can't find unremoved attestation of Claim hash: ${claimHash}.`
  );

  attestation.removalBlockId = await saveBlock(block);
  attestation.valid = false;

  await attestation.save();

  await handleCTypeAggregations(attestation, "REMOVED");
}

// TODO: Add a handler for the (future) Event emitted when the deposit owner is changed
// related to:
// #[pallet::call_index(4)]
// #[pallet::weight(<T as pallet::Config>::WeightInfo::change_deposit_owner())]
// pub fn change_deposit_owner(origin: OriginFor<T>, claim_hash: ClaimHashOf<T>) -> DispatchResult
