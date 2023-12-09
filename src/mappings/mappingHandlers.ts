import type {
  SubstrateBlock,
  SubstrateEvent,
  SubstrateExtrinsic,
} from "@subql/types";
import { CType, Attestation, Block } from "../types";
import assert from "assert";
import type { CTypeHash, DidUri, ICType } from "@kiltprotocol/types";
import * as alphabetic from "jsonabc";

// TODO: Remove the UNKNOWN constant before deployment.
/** Solves problems while trying to start Data Base from higher block. */
const UNKNOWN = "UNKNOWN_BECAUSE_IT_IS_PREHISTORIC";

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

  attestation.revocationBlockId = await saveBlock(block);
  attestation.valid = false;

  await attestation.save();

  await handleCTypeAggregations(attestation.cTypeId, "REVOKED");
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

  attestation.removalBlockId = await saveBlock(block);
  attestation.valid = false;

  await attestation.save();

  await handleCTypeAggregations(attestation.cTypeId, "REMOVED");
}

export async function handleCTypeCreated(event: SubstrateEvent): Promise<void> {
  // A new CType has been created.\[creator identifier, CType hash\]"
  const {
    block,
    event: {
      data: [authorDID, cTypeHash],
    },
    extrinsic,
  } = event;

  logger.info(`New CType registered at block ${block.block.header.number}`);

  logger.trace(
    `The whole CTypeCreated event: ${JSON.stringify(event.toHuman(), null, 2)}`
  );

  const blockNumber = await saveBlock(block);
  const cTypeId = "kilt:ctype:" + cTypeHash.toHex();
  const author = "did:kilt:" + authorDID.toString();

  const definition = extractCTypeDefinition(extrinsic, cTypeHash.toHex());

  const newCType = CType.create({
    id: cTypeId,
    registrationBlockId: blockNumber,
    author: author,
    definition: definition,
    attestationsCreated: 0,
    attestationsRevoked: 0,
    attestationsRemoved: 0,
    validAttestations: 0,
  });

  await newCType.save();
}

/** Extracts the cType definition (schema) from the extrinsic, coming from the event.
 *
 * In case that there are several cType creations in one extrinsic batch, it would hash the definitions and compare with `cTypeHash`.
 *
 * @param extrinsic
 * @param cTypeHash Hex-string from Event. Without "kilt:ctype:"
 */
function extractCTypeDefinition(
  extrinsic: SubstrateExtrinsic | undefined,
  cTypeHash: string
): string {
  assert(extrinsic, "Extrinsic not defined");

  const blockNumber = extrinsic.block.block.header.number.toString();

  const decodedExtrinsic = extrinsic.extrinsic.toHuman() as any;

  // Depending on the type of call, the extraction of the ctype definition is different
  const callIndex = extrinsic.extrinsic.callIndex.toString();

  const relevantCallIndices = {
    /** DID-Pallet: 64, submit_did_call: [pallet::call_index(12)] */
    submitDidCallIndex: "64,12",
    /** Utility-Pallet: 40, batch-all: [pallet::call_index(2)]  <-- comes directly von substrate
     *
     * https://github.com/paritytech/polkadot-sdk/blob/f3073d8b33dc645da646962983f887505e1aef6e/substrate/frame/utility/src/lib.rs#L304C27-L304C27
     */
    utilityBatchAllCallIndex: "40,2",
  };

  let definition = "Definitely a Definition";

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

      // TODO: hash the definition and compare with ctype-id

      /**
       * Utility for (re)creating CType hashes.
       * Sorts the schema and strips the $id property (which contains the CType hash) before stringifying.
       *
       * Encodes the provided CType for use in `api.tx.ctype.add()`.
       *
       * @param cType The CType (with or without $id).
       * @returns A deterministic JSON serialization of a CType, omitting the $id property.
       */
      function serializeForHash(cTypeSchema: ICType) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { $id, ...schemaWithoutId } = cTypeSchema;
        return encodeObjectAsStr(schemaWithoutId);
      }

      /**
       * Stringifies numbers, booleans, and objects. Object keys are sorted to yield consistent hashing.
       *
       * @param value Object or value to be hashed.
       * @returns Stringified representation of the given object.
       */
      function encodeObjectAsStr(
        value: Record<string, any> | string | number | boolean
      ): string {
        const input =
          // eslint-disable-next-line no-nested-ternary
          typeof value === "object" && value !== null
            ? JSON.stringify(alphabetic.sortObj(value))
            : // eslint-disable-next-line no-nested-ternary
            typeof value === "number" && value !== null
            ? value.toString()
            : typeof value === "boolean" && value !== null
            ? JSON.stringify(value)
            : value;
        return input.normalize("NFC");
      }

      addCtypeCalls.map((call) => {
        const cTypeString: string = call.args.did_call.call.args.ctype;
        const cTypeSchema: ICType = JSON.parse(cTypeString);
        const cTypeHashed = serializeForHash(cTypeSchema);

        return cTypeHash === cTypeHashed;
      });

      assert(
        addCtypeCalls.length === 1,
        "Not (only) one add-ctype extrinsic in this utility batch"
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
      validAttestations: 0,
      author: UNKNOWN,
      registrationBlockId: UNKNOWN,
      definition: UNKNOWN,
    });
  }

  const attestationsOfThisCType = await Attestation.getByFields([
    ["cTypeId", "=", cTypeId],
  ]);

  aggregation.validAttestations = attestationsOfThisCType.filter(
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
 * Saves Block information into our Data Base.
 *
 * @param block
 * @returns Returns the Block-Hash, also known as Block-ID.
 */
async function saveBlock(block: SubstrateBlock) {
  const blockNumber = block.block.header.number.toString();
  const blockHash = block.block.hash.toHex();
  const issuanceDate = block.timestamp;

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
    block,
    event: {
      data: [attesterDID, claimHash],
    },
  } = event;

  logger.trace(
    `The whole event involving a prehistoric attestation: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
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
