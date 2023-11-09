import { SubstrateEvent } from "@subql/types";
import { Aggregation, Attestation, Block, NewAttestation } from "../types";
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

  logger.info(`The whole event: ${JSON.stringify(event.toJSON(), null, 2)}`);
  const cTypeId = "kilt:ctype:" + cTypeHash.toHex();

  const blockNumber = event.block.block.header.number.toBigInt();
  const blockHash = event.block.block.hash.toHex();
  const payer = event.extrinsic!.extrinsic.signer.toString();

  // unpack delegation, which has changed between runtimes
  let delegation: typeof delegationID | undefined = delegationID;
  delegation = (delegation as any).unwrapOr(undefined);
  // later delegation ids are wrapped in an enum
  if (delegation?.toRawType().startsWith('{"_enum":')) {
    delegation = (delegation as any).value;
  }

  const attestation = Attestation.create({
    id: `${blockNumber.toString(10)}-${idx}`,
    claimHash: claimHash.toHex(),
    valid: true,
    createdDate: event.block.timestamp,
    createdBlock: blockNumber,
    createdBlockHash: blockHash,
    creator: payer,
    cType: cTypeId,
    attester: "did:kilt:" + attesterDID.toString(),
    delegationID: delegation?.toHex(),
  });

  await attestation.save();

  // New version:

  const creationBlock = Block.create({
    id: blockHash,
    number: blockNumber,
    timeStamp: event.block.timestamp,
  });

  const printableBlock = {
    id: creationBlock.id,
    number: creationBlock.number.toString(),
    timeStamp: creationBlock.timeStamp,
  };
  logger.info(`Block being saved: ${JSON.stringify(printableBlock, null, 2)}`);

  await creationBlock.save();

  // const counter = await Attestation.getByFields()

  const newAttestation = NewAttestation.create({
    id: `${blockNumber.toString(10)}-${idx}`,
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
