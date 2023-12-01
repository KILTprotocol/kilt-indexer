import type { SubstrateBlock, SubstrateEvent } from "@subql/types";
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
    block,
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

  const definition = extractCTypeDefinition(block);

  const newCType = CType.create({
    id: cTypeId,
    registrationBlockId: blockNumber,
    author: author,
    definition: definition,
    attestationsCreated: 0,
    attestationsRevoked: 0,
    attestationsRemoved: 0,
    invalidAttestations: 0,
  });

  await newCType.save();
}

/** Extracts the cType definition (schema) from the extrinsic inside of the block.
 *
 * @param block
 */
function extractCTypeDefinition(block: SubstrateBlock): string {
  const blockNumber = block.block.header.number.toString();

  const relevantCallIndices = {
    /** DID-Pallet: 64, submit_did_call: [pallet::call_index(12)] */
    submitDidCallIndex: "64,12",
    /** Utility-Pallet: 40, batch-all: [pallet::call_index(2)]  <-- could not find this on github repo */
    utilityBatchAllCallIndex: "40,2",
  };

  const relevantExtrinsics = block.block.extrinsics.filter((extrinsic, i) => {
    const callIndex = extrinsic.callIndex.toString();
    logger.info(`Extrinsic #${i} has the call index: ${callIndex}`);

    return Object.values(relevantCallIndices).includes(callIndex);
  });

  logger.info(
    `Length of the relevantExtrinsics array is ${relevantExtrinsics?.length}`
  );

  // Print all relevantExtrinsics
  relevantExtrinsics.forEach((extrinsic, index) => {
    const decodedExtry = extrinsic.toHuman();
    logger.info(
      `Extrinsic #${index} as "toHuman" from Block` +
        JSON.stringify(decodedExtry, null, 2)
    );
  });

  assert(
    relevantExtrinsics.length > 0,
    `No submit_did_call extrinsic on block #${blockNumber}`
  );

  // TODO: manage case with several relevantExtrinsics on the block, possibly from same DID ;(

  // To find a block where this happens:

  assert(
    relevantExtrinsics.length <= 1,
    `More than one submit_did_call extrinsic on block #${blockNumber}`
  );

  const chosenExtrinsic = relevantExtrinsics[0];

  const decodedExtrinsic = chosenExtrinsic.toHuman() as any;

  let definition = "Definitely a Definition";

  // Depending on the type of call, the extraction of the ctype definition is different
  const callIndex = chosenExtrinsic.callIndex.toString();

  switch (callIndex) {
    case relevantCallIndices.submitDidCallIndex:
      definition = decodedExtrinsic.method.args.did_call.call.args.ctype;

      break;

    case relevantCallIndices.utilityBatchAllCallIndex:
      const batchInternalCalls: any[] = decodedExtrinsic.method.args.calls;
      const addCtypeCalls = batchInternalCalls.filter(
        (call) =>
          call.args.did_call.call.section === "ctype" &&
          call.args.did_call.call.method === "add"
      );
      assert(
        addCtypeCalls.length === 1,
        "Not (only) one ctype add extrinsic in this utility batch"
      );
      definition = addCtypeCalls[0].args.did_call.call.args.ctype;

      break;
  }

  assert(
    definition,
    `Could not extract ctype definition from extrinsic in block #${blockNumber}`
  );

  // Print the definition
  logger.info(`typeof definition: ${typeof definition}`);
  logger.info(`cType definition: ${definition}`);

  return definition;
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
