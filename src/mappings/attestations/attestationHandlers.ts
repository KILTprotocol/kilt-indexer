import type { SubstrateEvent } from "@subql/types";
import { Attestation, Did } from "../../types";
import assert from "assert";
import { saveBlock } from "../blocks/saveBlock";
import { handleCTypeAggregations } from "../cTypes/cTypeHandlers";
import { countEntitiesByFields } from "../utils/countEntitiesByFields";

export async function handleAttestationCreated(
  event: SubstrateEvent
): Promise<void> {
  // A new attestation has been created.
  // data struct = { attester, claim_hash, ctype_hash, authorized_by} (can be accessed positionally)
  const {
    block,
    event: {
      data: [attesterDID, claimHash, cTypeHash, delegationID],
    },
    extrinsic,
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
  const payer = extrinsic!.extrinsic.signer.toString();
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
  const lastAttestation = (
    await Attestation.getByFields(
      [
        ["claimHash", "=", claimHash.toHex()],
        // ["removalBlockId", "=", undefined],  // unreliable out of unknown reasons
      ],
      { limit: 1, orderBy: "creationBlockId", orderDirection: "DESC" }
    )
  )[0];

  assert(
    !lastAttestation || lastAttestation.removalBlockId,
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
  // An attestation has been revoked.
  // data struct = { attester, claim_hash, ctype_hash, authorized_by} (can be accessed positionally)
  const {
    block,
    event: {
      data: [attesterDID, claimHash],
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
  const attestation = (
    await Attestation.getByFields(
      [
        ["claimHash", "=", claimHash.toHex()],
        ["valid", "=", true],
      ],
      { limit: 1, orderBy: "creationBlockId", orderDirection: "DESC" }
    )
  )[0];

  assert(
    attestation,
    `Can't find valid attestation of Claim hash: ${claimHash}.`
  );

  attestation.revocationBlockId = await saveBlock(block);
  attestation.valid = false;

  await attestation.save();

  await handleCTypeAggregations(attestation, "REVOKED");
}

export async function handleAttestationRemoved(
  event: SubstrateEvent
): Promise<void> {
  // An attestation has been removed.
  // data struct = { attester, claim_hash, ctype_hash, authorized_by} (can be accessed positionally)
  const {
    block,
    event: {
      data: [attesterDID, claimHash],
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
    [
      ["claimHash", "=", claimHash.toHex()],
      // ["removalBlockId", "=", undefined],  // unreliable out of unknown reasons
    ],
    { limit: 1, orderBy: "creationBlockId", orderDirection: "DESC" }
  );

  const attestation = attestations.find(
    (atty) => atty.removalBlockId == undefined
  );

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
  // "The deposit owner reclaimed a deposit by removing an attestation."
  // Attestation removed by owner reclaiming his deposit. (rephrased by me)
  // old runtime data tuple = [account id, claim hash]

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
    [
      ["claimHash", "=", claimHash.toHex()],
      // ["removalBlockId", "=", undefined],  // unreliable out of unknown reasons
    ],
    {
      limit: 1,
      orderBy: "creationBlockId",
      orderDirection: "DESC",
    }
  );

  const attestation = attestations.find(
    (atty) => atty.removalBlockId == undefined
  );
  assert(
    attestation,
    `Can't find unremoved attestation of Claim hash: ${claimHash}.`
  );

  attestation.removalBlockId = await saveBlock(block);
  attestation.valid = false;

  await attestation.save();

  await handleCTypeAggregations(attestation, "REMOVED");
}

export async function handleAttestationDepositOwnerChanged(
  event: SubstrateEvent
): Promise<void> {
  // The balance that is reserved by the current deposit owner will be freed and balance of the new deposit owner will get reserved.
  // \[id: ClaimHashOf, from: AccountIdOf, to: AccountIdOf\]
  const {
    block,
    event: {
      data: [claimHash, oldOwner, newOwner],
    },
  } = event;

  logger.info(
    `Attestation-Deposit changed it's owner at block ${block.block.header.number}`
  );

  logger.trace(
    `The whole AttestationDepositOwnerChanged event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  // Find the attestation of this claim hash that has not been removed yet.
  // There should only be one in the data base.
  const attestations = await Attestation.getByFields(
    [
      ["claimHash", "=", claimHash.toHex()],
      // ["removalBlockId", "=", undefined],  // unreliable out of unknown reasons
    ],
    { limit: 1, orderBy: "creationBlockId", orderDirection: "DESC" }
  );

  const attestation = attestations.find(
    (atty) => atty.removalBlockId == undefined
  );

  assert(
    attestation,
    `Can't find unremoved attestation of Claim hash: ${claimHash}.`
  );

  attestation.payer = newOwner.toString();

  await attestation.save();
}
