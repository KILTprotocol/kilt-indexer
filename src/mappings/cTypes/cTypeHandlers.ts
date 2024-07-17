import type { SubstrateEvent } from "@subql/types";
import { CType, Attestation, Did } from "../../types";
import { extractCTypeDefinition } from "./extractCTypeDefinition";
import { saveBlock } from "../blocks/saveBlock";
import assert from "assert";

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
  assert(authorDid, `Can't find this DID on the data base: ${authorId}.`);

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
  const aggregation = await CType.get(cTypeId);
  assert(aggregation, `Can't find this cType on the data base: ${cTypeId}.`);

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
