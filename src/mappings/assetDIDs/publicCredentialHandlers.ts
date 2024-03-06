import type { SubstrateEvent } from "@subql/types";
import assert from "assert";
import { saveBlock } from "../blocks/saveBlock";
import { UNKNOWN } from "../mappingHandlers";
import { saveAssetDid } from "./saveAssetDid";
import { PublicCredential } from "../../types";
import {
  type CredentialFromChain,
  extractCredential,
} from "./extractCredential";
import { createPrehistoricCredential } from "./createPrehistoricCredential";

export async function handlePublicCredentialStored(
  event: SubstrateEvent
): Promise<void> {
  // A new public credential has been issued.\[subject_id, credential_id\]
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
  const credentialHash = credentialID.toHex();

  const credential: CredentialFromChain = extractCredential(
    extrinsic,
    credentialHash
  );

  assert(
    assetDidUri === credential.subject.toLowerCase(),
    `The extracted public credential does not belongs to this assetDID. \n Target: ${assetDidUri} \n Obtained: ${credential.subject}`
  );

  const cTypeId = "kilt:ctype:" + credential.ctypeHash;

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

export async function handlePublicCredentialRemoved(
  event: SubstrateEvent
): Promise<void> {
  // A public credentials has been removed. \[subject_id, credential_id\]
  const {
    block,
    event: {
      data: [subjectID, credentialID],
    },
    extrinsic,
  } = event;

  logger.info(
    `Public Credential removed from chain state at block ${block.block.header.number}`
  );

  logger.info(
    `The whole CredentialRemoved event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const assetDidUri = await saveAssetDid(subjectID);
  const credentialHash = credentialID.toHex();

  let publicCredential = await PublicCredential.get(credentialHash);

  // the  public credential creation could have happened before the Data base's starting block
  try {
    // TODO: Unwrap the 'assert' and delete the try-catch before deployment. And make 'publicCredential' a constant.
    assert(
      publicCredential,
      `Can't find this Public Credential on the data base: ${publicCredential}.`
    );
  } catch (error) {
    logger.info(error);
    publicCredential = await createPrehistoricCredential(event);
  }

  publicCredential.valid = false;
  publicCredential.removalBlockId = blockNumber;

  await publicCredential.save();
}
