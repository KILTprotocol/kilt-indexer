import { SubstrateEvent } from "@subql/types";
import { Aggregation, Attestation } from "../types";
import assert from "assert";

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
    idx,
  } = event;

  const blockNumber = event.block.block.header.number.toBigInt();

  // unpack delegation, which has changed between runtimes
  let delegation: typeof delegationID | undefined = delegationID;
  delegation = (delegation as any).unwrapOr(undefined);
  // later delegation ids are wrapped in an enum
  if (delegation?.toRawType().startsWith('{"_enum":')) {
    delegation = (delegation as any).value;
  }

  const cTypeId = "kilt:ctype:" + cTypeHash.toHex();

  const attestation = Attestation.create({
    id: `${blockNumber.toString(10)}-${idx}`,
    claimHash: claimHash.toHex(),
    valid: true,
    createdDate: event.block.timestamp,
    createdBlock: blockNumber,
    createdBlockHash: event.block.block.hash.toHex(),
    creator: event.extrinsic!.extrinsic.signer.toString(),
    cType: cTypeId,
    attester: "did:kilt:" + attesterDID.toString(),
    delegationID: delegation?.toHex(),
  });

  await attestation.save();

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

  // Get the newest version of the attestation
  const [attestation] = attestations.slice(-1);

  // the attestation (creation) could have happened before the querying start block
  assert(attestation, `Can't find attestation of Claim hash: ${claimHash}.`);
  attestation.revokedDate = event.block.timestamp;
  attestation.revokedBlock = event.block.block.header.number.toBigInt();
  attestation.valid = false;

  await attestation.save();

  // Experiment:
  logger.info(`printing the attestations array:`);

  attestations.forEach((value, index) => {
    logger.info(
      `index: ${index}  value: ${JSON.stringify(
        {
          id: value.id,
          claimHash: value.claimHash,
          blockNumber: value.createdBlock.toString(),
          createdAt: value.createdDate,
        },
        null,
        2
      )}`
    );
  });

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

  // Get the newest version
  const [attestation] = attestations.slice(-1);

  // the attestation (creation) could have happened before the querying start block
  assert(attestation, `Can't find attestation of Claim hash: ${claimHash}`);
  attestation.removedDate = event.block.timestamp;
  attestation.removedBlock = event.block.block.header.number.toBigInt();
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
