import { CType, Did } from "../../types";

import { UNKNOWN } from "../mappingHandlers";

export async function createPrehistoricCType(
  blockNumber: string
): Promise<CType> {
  const cTypeId = "kilt:ctype:" + UNKNOWN;
  const authorId = "did:kilt:" + UNKNOWN;

  let prehistoricDID = await Did.get(authorId);
  if (!prehistoricDID) {
    prehistoricDID = Did.create({
      id: authorId,
      payer: UNKNOWN,
      creationBlockId: blockNumber,
      active: true,
    });

    await prehistoricDID.save();
  }

  let prehistoricCType = await CType.get(cTypeId);

  if (!prehistoricCType) {
    prehistoricCType = CType.create({
      id: cTypeId,
      registrationBlockId: blockNumber,
      authorId: authorId,
      definition: UNKNOWN,
      attestationsCreated: 0,
      attestationsRevoked: 0,
      attestationsRemoved: 0,
      validAttestations: 0,
    });

    await prehistoricCType.save();
    logger.info(`Prehistoric CType saved at block ${blockNumber}`);
  }

  return prehistoricCType;
}
