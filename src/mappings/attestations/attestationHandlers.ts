import type { SubstrateEvent } from "@subql/types";
import { Attestation, Did } from "../../types";
import assert from "assert";
import { saveBlock } from "../blocks/saveBlock";
import { handleCTypeAggregations } from "../cTypes/cTypeHandlers";

const getterOptions = { limit: 1000 };

export async function handleAttestationCreated(
  event: SubstrateEvent
): Promise<void> {
  // A new attestation has been created.\[attester DID, claim hash, CType hash, (optional) delegation ID\]
  const {
    block,
    event: {
      data: [attesterDID, claimHash, cTypeHash, delegationID],
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
  const attestations = await Attestation.getByFields(
    [["creationBlockId", "=", blockNumber]],
    getterOptions
  );
  /** Only counts the number of attestations created on one block.
   * It will not match with the event index from subscan that count all kinds of events.
   */
  const eventIndex = attestations.length;

  // unpack delegation, which has changed between runtimes
  // old runtime: "type_name":"Option<DelegationNodeIdOf>" --> was never used XD
  // new runtime: "type_name":"Option<AuthorizationIdOf>" --> value is nested
  let delegation: typeof delegationID | undefined = delegationID;
  delegation = (delegation as any).unwrapOr(undefined);
  // later delegation ids are wrapped in an enum
  if (delegation?.toRawType().startsWith('{"_enum":')) {
    delegation = (delegation as any).value;
  }

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
  const attestations = await Attestation.getByFields(
    [["claimHash", "=", claimHash.toHex()]],
    getterOptions
  );
  // another way of doing it:
  // const attestations = await store.getByField(
  //   "Attestation",
  //   "claimHash",
  //   claimHash.toHex()
  // );

  // Get the attestation that is still valid
  const attestation = attestations.find((atty) => atty.valid);
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

  // There could be several attestations with the same claim hash.
  // Given that the older ones has been previously removed from the chain state
  const attestations = await Attestation.getByFields(
    [["claimHash", "=", claimHash.toHex()]],
    getterOptions
  );

  logger.trace(`printing the attestations array:`);
  attestations.forEach((atty, index) => {
    logger.trace(
      `Index: ${index}, attestation: ${JSON.stringify(atty, null, 2)}`
    );
  });

  // Get the attestation that has still not been removed yet:
  const attestation = attestations.find((atty) => !atty.removalBlockId);
  assert(attestation, `Can't find attestation of Claim hash: ${claimHash}.`);

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

  // There could be several attestations with the same claim hash.
  // Given that the older ones has been previously removed from the chain state
  const attestations = await Attestation.getByFields(
    [["claimHash", "=", claimHash.toHex()]],
    getterOptions
  );

  logger.trace(`printing the attestations array:`);
  attestations.forEach((atty, index) => {
    logger.trace(
      `Index: ${index}, attestation: ${JSON.stringify(atty, null, 2)}`
    );
  });

  // Get the attestation that has still not been removed yet:
  const attestation = attestations.find((atty) => !atty.removalBlockId);
  assert(attestation, `Can't find attestation of Claim hash: ${claimHash}.`);

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
