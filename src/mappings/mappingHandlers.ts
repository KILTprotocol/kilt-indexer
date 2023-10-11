import { SubstrateEvent } from "@subql/types";
import { Aggregation, Attestation } from "../types";
import assert from "assert";

export async function handleAttestationCreated(
  event: SubstrateEvent
): Promise<void> {
  logger.info(
    `New attestation created at block ${event.block.block.header.number}`
  );
  // A new attestation has been created.\[attester ID, claim hash, CType hash, (optional) delegation ID\]
  const {
    event: {
      data: [attesterID, claimHash, cTypeHash, delegationID],
    },
  } = event;

  // unpack delegation, which has changed between runtimes
  let delegation: typeof delegationID | undefined = delegationID;
  delegation = (delegation as any).unwrapOr(undefined);
  // later delegation ids are wrapped in an enum
  if (delegation?.toRawType().startsWith('{"_enum":')) {
    delegation = (delegation as any).value;
  }

  const cTypeId = "kilt:ctype:" + cTypeHash.toHex();

  const attestation = Attestation.create({
    id: claimHash.toHex(),
    createdDate: event.block.timestamp,
    createdBlock: event.block.block.header.number.toBigInt(),
    createdBlockHash: event.block.block.hash.toHex(),
    creator: event.extrinsic!.extrinsic.signer.toString(),
    cType: cTypeId,
    attester: "did:kilt:" + attesterID.toString(),
    delegationID: delegation?.toHex(),
  });

  await attestation.save();

  await handleCTypeAggregations(cTypeId, "CREATED");
}

export async function handleAttestationRevoked(
  event: SubstrateEvent
): Promise<void> {
  logger.info(
    `New attestation revoked at block ${event.block.block.header.number}`
  );
  // An attestation has been revoked.\[account id, claim hash\]
  const {
    event: {
      data: [accountID, claimHash],
    },
  } = event;

  const attestation = await Attestation.get(claimHash.toString());

  assert(attestation, "Can't find an attestation");
  attestation.revokedDate = event.block.timestamp;
  attestation.revokedBlock = event.block.block.header.number.toBigInt();
  attestation.revoker = accountID.toString();

  await attestation.save();

  await handleCTypeAggregations(attestation.cType, "REVOKED");
}

export async function handleCTypeAggregations(
  cType: string,
  type: "CREATED" | "REVOKED"
): Promise<void> {
  let aggregation = await Aggregation.get(cType);
  if (!aggregation) {
    aggregation = Aggregation.create({
      id: cType,
      attestationsCreated: 0,
      attestationsRevoked: 0,
    });
  }
  if (type === "CREATED") {
    aggregation.attestationsCreated++;
  } else if (type === "REVOKED") {
    aggregation.attestationsRevoked++;
  }

  await aggregation.save();
}
