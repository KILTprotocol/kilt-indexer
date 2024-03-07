import { CType } from "../../types";

import { UNKNOWN } from "../mappingHandlers";

export async function createPrehistoricCType(
  blockNumber: string
): Promise<CType["id"]> {
  const cTypeId = "kilt:ctype:" + UNKNOWN;
  const author = "did:kilt:" + UNKNOWN;

  let prehistoricCType = await CType.get(cTypeId);

  if (!prehistoricCType) {
    prehistoricCType = CType.create({
      id: cTypeId,
      registrationBlockId: blockNumber,
      author: author,
      definition: UNKNOWN,
      attestationsCreated: 0,
      attestationsRevoked: 0,
      attestationsRemoved: 0,
      validAttestations: 0,
    });

    await prehistoricCType.save();
    logger.info(`Prehistoric CType saved at block ${blockNumber}`);
  }

  return prehistoricCType.id;
}
