import type { SubstrateEvent } from "@subql/types";
import { CType, Attestation } from "../../types";
import { extractCTypeDefinition } from "./extractCTypeDefinition";
import { saveBlock } from "../blocks/saveBlock";
import { UNKNOWN } from "../mappingHandlers";

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
