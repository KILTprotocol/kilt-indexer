import { SubstrateEvent } from "@subql/types";
import { Aggregation, Attestation, Block } from "../types";
import assert from "assert";

export async function handleAttestationCreated(
  event: SubstrateEvent
): Promise<void> {
  logger.info(
    `New attestation created at block ${event.block.block.header.number}`
  );
  // A new attestation has been created.\[attester DID, claim hash, CType hash, (optional) delegation ID\]
  // on Polkadot.js the delegationID is called authorizationId
  const {
    event: {
      data: [attesterDID, claimHash, cTypeHash, delegationID],
    },
    idx,
  } = event;

  // idx describes the type of event, not the count:
  // Ex.: idx= 0x3e00 = 64:00 = Attestation Pallet: 0th Event (att. created)

  // phase.applyExtrinsic is a counter but just for the extrinsic, not the event

  logger.info(`The whole event: ${JSON.stringify(event.toJSON(), null, 2)}`);

  const blockHash = await saveBlock(event);
  const blockNumber = event.block.block.header.number.toBigInt();
  const cTypeId = "kilt:ctype:" + cTypeHash.toHex();
  const payer = event.extrinsic!.extrinsic.signer.toString();

  // craft my event ordinal index:
  const attestations = await Attestation.getByFields([
    ["creationBlockId", "=", blockHash],
  ]);
  /** Only counts the number of attestations created on one block.
   * It will not match with the event index from subscan that count all kinds of events.
   */
  const eventIndex = attestations.length;

  // unpack delegation, which has changed between runtimes
  let delegation: typeof delegationID | undefined = delegationID;
  delegation = (delegation as any).unwrapOr(undefined);
  // later delegation ids are wrapped in an enum
  if (delegation?.toRawType().startsWith('{"_enum":')) {
    delegation = (delegation as any).value;
  }

  const newAttestation = Attestation.create({
    id: `${blockNumber.toString(10)}#${eventIndex}`,
    claimHash: claimHash.toHex(),
    cType: cTypeId,
    attester: "did:kilt:" + attesterDID.toString(),
    payer: payer,
    valid: true,
    creationBlockId: blockHash,
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

  logger.info(`The whole event: ${JSON.stringify(event.toJSON(), null, 2)}`);

  // There could be several attestations with the same claim hash.
  // Given that the older ones has been previously removed from the chain state
  const attestations = await Attestation.getByFields([
    ["claimHash", "=", claimHash.toHex()],
  ]);
  // anther way of doing it:
  // const attestations = await store.getByField(
  //   "Attestation",
  //   "id",
  //   claimHash.toString()
  // );

  // Get the attestation that is still valid
  const attestation = attestations.find((atty) => atty.valid);

  // the attestation (creation) could have happened before the DB start block
  assert(attestation, `Can't find attestation of Claim hash: ${claimHash}.`);

  attestation.revocationBlockId = await saveBlock(event);
  attestation.valid = false;

  await attestation.save();

  await handleCTypeAggregations(attestation.cType, "REVOKED");
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

  logger.info(`The whole event:: ${event.toHuman()}`);

  // There could be several attestations with the same claim hash.
  // Given that the older ones has been previously removed from the chain state
  const attestations = await Attestation.getByFields([
    ["claimHash", "=", claimHash.toHex()],
  ]);

  logger.info(`printing the attestations array: ${attestations}`);

  // Get the attestation that still has not been removed yet:
  const attestation = attestations.find((atty) => atty.removalBlockId === null);

  // the attestation (creation) could have happened before the DB start block
  assert(attestation, `Can't find attestation of Claim hash: ${claimHash}`);

  attestation.revocationBlockId = await saveBlock(event);
  attestation.valid = false;

  await attestation.save();

  await handleCTypeAggregations(attestation.cType, "REMOVED");
}

export async function handleCTypeAggregations(
  cType: string,
  type: "CREATED" | "REVOKED" | "REMOVED"
): Promise<void> {
  let aggregation = await Aggregation.get(cType);
  if (!aggregation) {
    aggregation = Aggregation.create({
      id: cType,
      attestationsCreated: 0,
      attestationsRevoked: 0,
      attestationsRemoved: 0,
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
 *
 * @param event
 * @returns Returns the Block-Hash, also known as Block-ID.
 */
async function saveBlock(event: SubstrateEvent) {
  const blockNumber = event.block.block.header.number.toBigInt();
  const blockHash = event.block.block.hash.toHex();
  const issuanceDate = event.block.timestamp;

  const exists = await Block.get(blockHash);
  // Existence check not really necessary if we trust the chain
  // If you create the same block twice, it just get overwritten with the same info
  if (!exists) {
    const block = Block.create({
      id: blockHash,
      number: blockNumber,
      timeStamp: issuanceDate,
    });

    const printableBlock = {
      id: block.id,
      number: block.number.toString(),
      timeStamp: block.timeStamp,
    };
    logger.info(
      `Block being saved: ${JSON.stringify(printableBlock, null, 2)}`
    );

    await block.save();
  } else {
    // To prove my theory:
    if (
      blockHash !== exists.id ||
      blockNumber !== exists.number ||
      issuanceDate !== exists.timeStamp
    ) {
      throw new Error(`Inconsistent Block! ${blockHash}`);
    }

    // TODO: delete that Existence Check (& the printing) after run it for a while
  }
  return blockHash;
}
