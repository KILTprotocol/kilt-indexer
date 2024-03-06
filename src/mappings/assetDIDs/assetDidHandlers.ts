import type { SubstrateEvent } from "@subql/types";
import assert from "assert";
import { saveBlock } from "../blocks/saveBlock";
import { UNKNOWN } from "../mappingHandlers";
import { saveAssetDid } from "./saveAssetDid";
import { PublicCredential } from "../../types";
import {
  CredentialFromChain,
  extractCredentialClaims,
} from "./extractCredentialClaims";

export async function handlePublicCredentialStored(
  event: SubstrateEvent
): Promise<void> {
  // A new public credential has been issued.\[subject_id, credential_id\]"
  const {
    block,
    event: {
      data: [subjectID, credentialID],
    },
    extrinsic,
  } = event;

  logger.info(
    `New Public Credential registered at block ${block.block.header.number}`
  );

  logger.info(
    `The whole CredentialStored event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const assetDidUri = await saveAssetDid(subjectID);
  const claimsHash = credentialID.toHex();

  const credential: CredentialFromChain = extractCredentialClaims(
    extrinsic,
    claimsHash
  );

  const cTypeId = "kilt:ctype:" + credential.ctypeHash;

  assert(
    assetDidUri === credential.subject.toLowerCase(),
    `The extracted public credential does not belongs to this assetDID. \n Target: ${assetDidUri} \n Obtained: ${credential.subject}`
  );

  const newPublicCredential = PublicCredential.create({
    id: credentialID.toHex(),
    objectId: assetDidUri,
    creationBlockId: blockNumber,
    valid: true,
    cTypeId,
    claim: credential.claims,
    attesterId: credential.attesterDid,
    delegationID: credential.authorization ?? undefined,
  });

  await newPublicCredential.save();
}
