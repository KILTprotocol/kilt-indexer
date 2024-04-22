import type { SubstrateEvent } from "@subql/types";
import { CType, Attestation, Did } from "../../types";
import { extractCTypeDefinition } from "./extractCTypeDefinition";
import { saveBlock } from "../blocks/saveBlock";
import { UNKNOWN } from "../mappingHandlers";
import { createPrehistoricCType } from "./createPrehistoricCType";
import assert from "assert";
import { createPrehistoricDID } from "../dids/createPrehistoricDID";

export async function handleCTypeCreated(event: SubstrateEvent): Promise<void> {
  // A new CType has been created.\[creator identifier, CType hash\]
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
  const authorId = "did:kilt:" + authorDID.toString();

  const authorDid = await Did.get(authorId);

  // the did (creation) could have happened before the Data base's starting block
  try {
    // TODO: Unwrap the 'assert' and delete the try-catch before deployment.
    assert(authorDid, `Can't find this DID on the data base: ${authorId}.`);
  } catch (error) {
    logger.info(error);
    await createPrehistoricDID(event);
  }

  const definition = extractCTypeDefinition(extrinsic, cTypeHash.toHex());

  const newCType = CType.create({
    id: cTypeId,
    registrationBlockId: blockNumber,
    authorId: authorId,
    definition: definition,
    attestationsCreated: 0,
    attestationsRevoked: 0,
    attestationsRemoved: 0,
    validAttestations: 0,
  });

  await newCType.save();
}

export async function handleCTypeAggregations(
  cTypeId: string,
  action: "CREATED" | "REVOKED" | "REMOVED"
): Promise<void> {
  let aggregation = await CType.get(cTypeId);

  // TODO: Remove this if-statement before deployment!
  if (!aggregation) {
    // this happens when the DB starts later than the creation of the cType
    aggregation = await createPrehistoricCType(UNKNOWN);
  }

  const attestationsOfThisCType =
    (await Attestation.getByCTypeId(cTypeId)) || [];

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
