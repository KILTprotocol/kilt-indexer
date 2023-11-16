import type { SubstrateEvent } from "@subql/types";
import { CType, Attestation, Block } from "../types";
import assert from "assert";

logger.level = "trace";

export async function handleAttestationCreated(
  event: SubstrateEvent
): Promise<void> {
  logger.info(
    `New attestation created at block ${event.block.block.header.number}`
  );
  // A new attestation has been created.\[attester DID, claim hash, CType hash, (optional) delegation ID\]
  const {
    event: {
      data: [attesterDID, claimHash, cTypeHash, delegationID],
    },
  } = event;

  // idx describes the type of event, not the count:
  // Ex.: idx= 0x3e00 = 64:00 = Attestation Pallet: 0th Event (att. created)

  // phase.applyExtrinsic is a counter but just for the extrinsic, not the event

  logger.trace(
    `The whole AttestationCreated event: ${JSON.stringify(
      event.toJSON(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(event);
  const cTypeId = "kilt:ctype:" + cTypeHash.toHex();
  const payer = event.extrinsic!.extrinsic.signer.toString();

  // craft my event ordinal index:
  const attestations = await Attestation.getByFields([
    ["creationBlockId", "=", blockNumber],
  ]);
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
    attester: "did:kilt:" + attesterDID.toString(),
    payer: payer,
    valid: true,
    creationBlockId: blockNumber,
    delegationID: delegation?.toHex(),
  });

  await newAttestation.save();
  await handleCTypeAggregations(cTypeId, "CREATED");
}

export async function handleAttestationRevoked(
  event: SubstrateEvent
): Promise<void> {
  logger.info(
    `Attestation revoked at block ${event.block.block.header.number}`
  );
  // An attestation has been revoked.\[attester DID, claim hash\]
  const {
    event: {
      data: [attesterDID, claimHash],
    },
  } = event;

  logger.trace(
    `The whole AttestationRevoked event: ${JSON.stringify(
      event.toJSON(),
      null,
      2
    )}`
  );

  // There could be several attestations with the same claim hash.
  // Given that the older ones has been previously removed from the chain state
  const attestations = await Attestation.getByFields([
    ["claimHash", "=", claimHash.toHex()],
  ]);
  // another way of doing it:
  // const attestations = await store.getByField(
  //   "Attestation",
  //   "id",
  //   claimHash.toHex()
  // );

  // Get the attestation that is still valid
  const attestation = attestations.find((atty) => atty.valid);

  // the attestation (creation) could have happened before the DB start block
  assert(attestation, `Can't find attestation of Claim hash: ${claimHash}.`);

  attestation.revocationBlockId = await saveBlock(event);
  attestation.valid = false;

  await attestation.save();

  await handleCTypeAggregations(attestation.cTypeId, "REVOKED");
}

export async function handleAttestationRemoved(
  event: SubstrateEvent
): Promise<void> {
  logger.info(
    `Attestation removed at block ${event.block.block.header.number}`
  );
  // An attestation has been removed.\[attester DID, claim hash\]
  const {
    event: {
      data: [attesterDID, claimHash],
    },
  } = event;

  logger.trace(`The whole AttestationRemoved event: ${event.toHuman()}`);

  // There could be several attestations with the same claim hash.
  // Given that the older ones has been previously removed from the chain state
  const attestations = await Attestation.getByFields([
    ["claimHash", "=", claimHash.toHex()],
  ]);

  logger.trace(`printing the attestations array: ${attestations}`);

  // Get the attestation that still has not been removed yet:
  const attestation = attestations.find((atty) => atty.removalBlockId === null);

  // the attestation (creation) could have happened before the DB start block
  assert(attestation, `Can't find attestation of Claim hash: ${claimHash}`);

  attestation.revocationBlockId = await saveBlock(event);
  attestation.valid = false;

  await attestation.save();

  await handleCTypeAggregations(attestation.cTypeId, "REMOVED");
}

export async function handleCTypeCreated(event: SubstrateEvent): Promise<void> {
  logger.info(
    `New CType registered at block ${event.block.block.header.number}`
  );
  // A new CType has been created.\[creator identifier, CType hash\]"
  const {
    event: {
      data: [authorDID, cTypeHash],
    },
  } = event;

  logger.trace(
    `The whole CTypeCreated event: ${JSON.stringify(event.toJSON(), null, 2)}`
  );

  const blockNumber = await saveBlock(event);
  const cTypeId = "kilt:ctype:" + cTypeHash.toHex();
  const author = "did:kilt:" + authorDID.toString();

  const newCType = CType.create({
    id: cTypeId,
    registrationBlockId: blockNumber,
    author: author,
    attestationsCreated: 0,
    attestationsRevoked: 0,
    attestationsRemoved: 0,
  });

  await newCType.save();
}

export async function handleCTypeAggregations(
  cTypeId: string,
  type: "CREATED" | "REVOKED" | "REMOVED"
): Promise<void> {
  let aggregation = await CType.get(cTypeId);

  // TODO: Remove this if-statement before deployment!
  if (!aggregation) {
    // this happens when the DB starts later than the creation of the cType
    aggregation = CType.create({
      id: cTypeId,
      attestationsCreated: 0,
      attestationsRevoked: 0,
      attestationsRemoved: 0,
      // author: undefined,
      // registrationBlockId: undefined
    });
  }

  switch (type) {
    case "CREATED":
      aggregation.attestationsCreated++;

      break;
    case "REVOKED":
      aggregation.attestationsRevoked++;

      break;
    case "REMOVED":
      aggregation.attestationsRemoved++;

      break;
  }
  await aggregation.save();
}

/**
 * Saves Block information from the Event into our Data Base.
 *
 * @param event
 * @returns Returns the Block-Hash, also known as Block-ID.
 */
async function saveBlock(event: SubstrateEvent) {
  const blockNumber = event.block.block.header.number.toString();
  const blockHash = event.block.block.hash.toHex();
  const issuanceDate = event.block.timestamp;

  const exists = await Block.get(blockNumber);
  // Existence check not really necessary if we trust the chain
  // If you create the same block twice, it just get overwritten with the same info
  if (!exists) {
    const block = Block.create({
      id: blockNumber,
      hash: blockHash,
      timeStamp: issuanceDate,
    });

    logger.info(`Block being saved: ${JSON.stringify(block, null, 2)}`);

    await block.save();
  } else {
    // To prove my theory:
    const conditions: boolean =
      blockHash === exists.hash &&
      blockNumber === exists.id &&
      issuanceDate.getTime() === exists.timeStamp.getTime();

    assert(conditions, `Inconsistent Block! ${blockNumber}`);

    // TODO: delete that Existence Check (& the printing) after running it for a while
  }
  return blockNumber;
}
