import type { SubstrateEvent } from "@subql/types";
import assert from "assert";
import { PublicCredential, Ruling, RulingNature } from "../../types";
import { saveBlock } from "../blocks/saveBlock";
import { createPrehistoricCredential } from "./createPrehistoricCredential";
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

  logger.info(
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
  const previousRulings =
    (await Ruling.getByCredentialId(credentialHash)) || [];

  const newRuling = Ruling.create({
    id: `§${previousRulings.length + 1}_${credentialHash}`,
    credentialId: credentialHash,
    nature: RulingNature.creation,
    rulingBlockId: blockNumber,
  });

  await newRuling.save();
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
  const assetDidUri = await saveAssetDid(subjectID as KiltAssetDidsV1AssetDid);
  const credentialHash = credentialID.toHex();

  let publicCredential = await PublicCredential.get(credentialHash);

  // Prehistoric Case:
  // the public credential creation could have happened before the Data base's starting block
  try {
    // TODO: Unwrap the 'assert' and delete the try-catch before deployment. And make 'publicCredential' a constant.
    assert(
      publicCredential,
      `Can't find this Public Credential on the data base. It's ID (hash): ${credentialHash}.`
    );
  } catch (error) {
    logger.info(error);
    publicCredential = await createPrehistoricCredential(event);
  }

  assert(
    assetDidUri === publicCredential.subjectId,
    "This Credential does not belong to this Asset-DID"
  );

  publicCredential.valid = false;

  await publicCredential.save();

  // Add a record of when did the removal took place
  const previousRulings =
    (await Ruling.getByCredentialId(credentialHash)) || [];

  const newRuling = Ruling.create({
    id: `§${previousRulings.length + 1}_${credentialHash}`,
    credentialId: credentialHash,
    nature: RulingNature.removal,
    rulingBlockId: blockNumber,
  });

  await newRuling.save();
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

  logger.info(
    `The whole CredentialRevoked event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const credentialHash = credentialID.toHex();

  let publicCredential = await PublicCredential.get(credentialHash);

  // Prehistoric Case:
  // the public credential creation could have happened before the Data base's starting block
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
  await publicCredential.save();

  // Add a record of when did the revocation took place
  const previousRulings =
    (await Ruling.getByCredentialId(credentialHash)) || [];

  const newRuling = Ruling.create({
    id: `§${previousRulings.length + 1}_${credentialHash}`,
    credentialId: credentialHash,
    rulingBlockId: blockNumber,
    nature: RulingNature.revocation,
  });

  await newRuling.save();
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

  logger.info(
    `The whole CredentialUnrevoked event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const credentialHash = credentialID.toHex();

  let publicCredential = await PublicCredential.get(credentialHash);

  // Prehistoric Case:
  // the public credential creation could have happened before the Data base's starting block
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

  publicCredential.valid = true;
  await publicCredential.save();

  // Add a record of when did the restoration (un-revocation) took place
  const previousRulings =
    (await Ruling.getByCredentialId(credentialHash)) || [];

  const newRuling = Ruling.create({
    id: `§${previousRulings.length + 1}_${credentialHash}`,
    credentialId: credentialHash,
    rulingBlockId: blockNumber,
    nature: RulingNature.restoration,
  });

  await newRuling.save();
}
