import type { SubstrateEvent } from "@subql/types";
import assert from "assert";
import { PublicCredential, Update, UpdateNature } from "../../types";
import { saveBlock } from "../blocks/saveBlock";
import {
  extractCredential,
  type CredentialFromChain,
} from "./extractCredential";
import { saveAssetDid } from "./saveAssetDid";
import { KiltAssetDidsV1AssetDid } from "@kiltprotocol/augment-api";

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

  logger.trace(
    `The whole CredentialStored event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const assetDidUri = await saveAssetDid(subjectID as KiltAssetDidsV1AssetDid);
  const credentialHash = credentialID.toHex();

  const credential: CredentialFromChain = extractCredential(
    extrinsic,
    credentialHash
  );

  assert(
    !assetDidUri.localeCompare(credential.subject, "en", {
      sensitivity: "base",
    }),
    `The extracted public credential does not belongs to this assetDID. \n Target: ${assetDidUri} \n Obtained: ${credential.subject}`
  );

  const cTypeId = "kilt:ctype:" + credential.ctypeHash;

  const newPublicCredential = PublicCredential.create({
    id: credentialHash,
    subjectId: assetDidUri,
    valid: true,
    cTypeId,
    claims: credential.claims,
    issuerId: credential.attesterDid,
    delegationID: credential.authorization ?? undefined,
  });

  await newPublicCredential.save();

  // Add a record of when did the creation took place
  const previousUpdates =
    (await Update.getByCredentialId(credentialHash)) || [];

  const newUpdate = Update.create({
    id: `§${previousUpdates.length + 1}_${credentialHash}`,
    credentialId: credentialHash,
    nature: UpdateNature.creation,
    updateBlockId: blockNumber,
  });

  await newUpdate.save();
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

  logger.trace(
    `The whole CredentialRemoved event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const assetDidUri = await saveAssetDid(subjectID as KiltAssetDidsV1AssetDid);
  const credentialHash = credentialID.toHex();

  const publicCredential = await PublicCredential.get(credentialHash);
  assert(
    publicCredential,
    `Can't find this Public Credential on the data base. It's ID (hash): ${credentialHash}.`
  );

  assert(
    assetDidUri === publicCredential.subjectId,
    "This Credential does not belong to this Asset-DID"
  );

  publicCredential.valid = false;

  await publicCredential.save();

  // Add a record of when did the removal took place
  const previousUpdates =
    (await Update.getByCredentialId(credentialHash)) || [];

  const newUpdate = Update.create({
    id: `§${previousUpdates.length + 1}_${credentialHash}`,
    credentialId: credentialHash,
    nature: UpdateNature.removal,
    updateBlockId: blockNumber,
  });

  await newUpdate.save();
}

export async function handlePublicCredentialRevoked(
  event: SubstrateEvent
): Promise<void> {
  // A public credential has been revoked. \[credential_id\]
  const {
    block,
    event: {
      data: [credentialID],
    },
    extrinsic,
  } = event;

  logger.info(
    `Public Credential revoked at block ${block.block.header.number}`
  );

  logger.trace(
    `The whole CredentialRevoked event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const credentialHash = credentialID.toHex();

  const publicCredential = await PublicCredential.get(credentialHash);
  assert(
    publicCredential,
    `Can't find this Public Credential on the data base: ${publicCredential}.`
  );

  publicCredential.valid = false;
  await publicCredential.save();

  // Add a record of when did the revocation took place
  const previousUpdates =
    (await Update.getByCredentialId(credentialHash)) || [];

  const newUpdate = Update.create({
    id: `§${previousUpdates.length + 1}_${credentialHash}`,
    credentialId: credentialHash,
    updateBlockId: blockNumber,
    nature: UpdateNature.revocation,
  });

  await newUpdate.save();
}

export async function handlePublicCredentialUnrevoked(
  event: SubstrateEvent
): Promise<void> {
  // A public credential has been unrevoked. \[credential_id\]
  const {
    block,
    event: {
      data: [credentialID],
    },
    extrinsic,
  } = event;

  logger.info(
    `Public Credential unrevoked at block ${block.block.header.number}`
  );

  logger.trace(
    `The whole CredentialUnrevoked event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const credentialHash = credentialID.toHex();

  const publicCredential = await PublicCredential.get(credentialHash);
  assert(
    publicCredential,
    `Can't find this Public Credential on the data base: ${publicCredential}.`
  );

  publicCredential.valid = true;
  await publicCredential.save();

  // Add a record of when did the restoration (un-revocation) took place
  const previousUpdates =
    (await Update.getByCredentialId(credentialHash)) || [];

  const newUpdate = Update.create({
    id: `§${previousUpdates.length + 1}_${credentialHash}`,
    credentialId: credentialHash,
    updateBlockId: blockNumber,
    nature: UpdateNature.restoration,
  });

  await newUpdate.save();
}
