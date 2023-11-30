import type { SubstrateEvent, SubstrateExtrinsic } from "@subql/types";
import { CType, Attestation, Block } from "../types";
import assert from "assert";

// TODO: Remove the UNKNOWN constant before deployment.
/** Solves problems while trying to start Data Base from higher block. */
const UNKNOWN = "UNKNOWN_BECAUSE_IT_IS_PREHISTORIC";

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
  let attestation = attestations.find((atty) => atty.valid);

  // the attestation (creation) could have happened before the DB start block
  try {
    // TODO: Unwrap the 'assert' and delete the try-catch before deployment. And make 'attestation' a constant.
    assert(attestation, `Can't find attestation of Claim hash: ${claimHash}.`);
  } catch (error) {
    logger.info(error);
    attestation = await createPrehistoricAttestation(event);
  }

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

  logger.trace(
    `The whole AttestationRemoved event: ${JSON.stringify(
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

  logger.trace(`printing the attestations array:`);
  attestations.forEach((atty, index) => {
    logger.trace(
      `Index: ${index}, attestation: ${JSON.stringify(atty, null, 2)}`
    );
  });

  // Get the attestation that still has not been removed yet:
  let attestation = attestations.find((atty) => !atty.removalBlockId);

  // the attestation (creation) could have happened before the DB start block
  try {
    // TODO: Unwrap the 'assert' and delete the try-catch before deployment. And make 'attestation' a constant.
    assert(attestation, `Can't find attestation of Claim hash: ${claimHash}.`);
  } catch (error) {
    logger.info(error);
    attestation = await createPrehistoricAttestation(event);
  }

  attestation.removalBlockId = await saveBlock(event);
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
    definition: UNKNOWN,
    attestationsCreated: 0,
    attestationsRevoked: 0,
    attestationsRemoved: 0,
    invalidAttestations: 0,
  });

  await newCType.save();
}

export async function handleCTypeDefined(
  metaExtrinsic: SubstrateExtrinsic
): Promise<void> {
  logger.info(
    `The whole cType Add extrinsic: ${JSON.stringify(metaExtrinsic, null, 2)}`
  );

  // Destructure!
  const {
    block,
    extrinsic: {
      data: [blockNB, call, submitter, txCounter],
    },
    events,
  } = metaExtrinsic;

  const blockNumber = block.block.header.hash.toString();
  const decodedExtrinsic = metaExtrinsic.extrinsic.toHuman();
  logger.info(
    "\n Extrinsic as toHuman " + JSON.stringify(decodedExtrinsic, null, 2)
  );
  // const definition = decodedExtrinsic.method.args.did_call.args.ctype;

  logger.info("printing the extrinsic data values: ");
  logger.info(`blockNB: ${blockNB}`);
  logger.info(`call: ${call}`);
  logger.info(`submitter: ${submitter}`);
  logger.info(`txCounter: ${txCounter}`);

  // Check if there is a cType Created emitted by this extrinsic
  const cTypeAddEventIndex = "0x3d00";
  const addCTypesEvents = events.filter((eventEntry) => {
    const index = eventEntry.event.index.toHex();
    logger.info(`The index of this event is:  ${index}`);
    return index === cTypeAddEventIndex;
  });

  if (addCTypesEvents.length) {
    logger.info("Found some Add-CType-Events on this extrinsic");
  }

  // Find cType entity to assign it to
  const cTypeEntities = await CType.getByRegistrationBlockId(blockNumber);
  logger.info(`printing the cTypes entities array:`);
  logger.info(`Length of the cTypeEntities array ${cTypeEntities?.length}`);

  assert(
    cTypeEntities,
    `Can't find any CType created on block  ${blockNumber}.`
  );
  cTypeEntities.forEach((claimType, index) => {
    logger.info(
      `Index: ${index}, cType: ${JSON.stringify(claimType, null, 2)}`
    );
  });
  const cTypeEntity = cTypeEntities[0];

  logger.info("\n Extrinsic  ERA: " + metaExtrinsic.extrinsic.era);
  logger.info("\n Extrinsic DATA: " + metaExtrinsic.extrinsic.data);

  if (cTypeEntity) {
    cTypeEntity.definition = call.toString();
    await cTypeEntity.save();
  }

  // TODO: extract ctype-add event from the extrinsic that look like this:
  //   {
  //     attestation-indexer-subquery-node-1   |       "phase": {
  //     attestation-indexer-subquery-node-1   |         "applyExtrinsic": 2
  //     attestation-indexer-subquery-node-1   |       },
  //     attestation-indexer-subquery-node-1   |       "event": {
  //     attestation-indexer-subquery-node-1   |         "index": "0x3d00",  ## most important
  //     attestation-indexer-subquery-node-1   |         "data": [
  //     attestation-indexer-subquery-node-1   |           "4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
  //     attestation-indexer-subquery-node-1   |           "0x47d04c42bdf7fdd3fc5a194bcaa367b2f4766a6b16ae3df628927656d818f420"
  //     attestation-indexer-subquery-node-1   |         ]
  //     attestation-indexer-subquery-node-1   |       },
  //     attestation-indexer-subquery-node-1   |       "topics": []
  //     attestation-indexer-subquery-node-1   |     },
}

export async function handleCTypeAggregations(
  cTypeId: string,
  action: "CREATED" | "REVOKED" | "REMOVED"
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
      invalidAttestations: 0,
      author: UNKNOWN,
      registrationBlockId: UNKNOWN,
      definition: UNKNOWN,
    });
  }

  const attestationsOfThisCType = await Attestation.getByFields([
    ["cTypeId", "=", cTypeId],
  ]);

  aggregation.invalidAttestations = attestationsOfThisCType.filter(
    (atty) => atty.valid
  ).length;

  switch (action) {
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

    logger.trace(`Block being saved: ${JSON.stringify(block, null, 2)}`);

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

/**
 * TODO: This function should be deleted before deployment.
 *
 * @param event a revocation or a removal of an attestation
 */
export async function createPrehistoricAttestation(
  event: SubstrateEvent
): Promise<Attestation> {
  logger.info(
    `An attestation from before the Database's startBlock is being added with default values.`
  );

  // The event is of one of this two types:
  // An attestation has been revoked.\[attester DID, claim hash\]
  // An attestation has been removed.\[attester DID, claim hash\]
  const {
    event: {
      data: [attesterDID, claimHash],
    },
  } = event;

  logger.trace(
    `The whole event involving a prehistoric attestation: ${JSON.stringify(
      event.toJSON(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(event);
  const cTypeId = "kilt:ctype:" + UNKNOWN;
  const payer = UNKNOWN;

  // craft my event ordinal index:
  const attestations = await Attestation.getByFields([
    ["creationBlockId", "=", blockNumber],
  ]);
  /** Only counts the number of attestations created on one block.
   * It will not match with the event index from subscan that count all kinds of events.
   */
  const eventIndex = attestations.length;

  const prehistoricAttestation = Attestation.create({
    id: `${blockNumber}-${eventIndex}`,
    claimHash: claimHash.toHex(),
    cTypeId: cTypeId,
    attester: "did:kilt:" + attesterDID.toString(),
    payer: payer,
    valid: true,
    creationBlockId: blockNumber,
  });

  await prehistoricAttestation.save();

  const unknownCType = await CType.get(cTypeId);
  if (!unknownCType) {
    // Would happen only once per data base:
    await handleCTypeAggregations(cTypeId, "CREATED");
  }

  return prehistoricAttestation;
}
