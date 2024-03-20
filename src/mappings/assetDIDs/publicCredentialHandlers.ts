import type { SubstrateEvent } from "@subql/types";
import assert from "assert";
import { saveBlock } from "../blocks/saveBlock";
import { UNKNOWN } from "../mappingHandlers";
import { saveAssetDid } from "./saveAssetDid";
import { PublicCredential, Ruling, RulingNature } from "../../types";
import {
  type CredentialFromChain,
  extractCredential,
} from "./extractCredential";
import { createPrehistoricCredential } from "./createPrehistoricCredential";

import { decode } from "../../../node_modules/cborg";

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

  const credential: CredentialFromChain = await extractCredential(
    extrinsic,
    credentialHash
  );

  const claimsU8a = Uint8Array.from(
    Buffer.from(credential.claims.split("x")[1], "hex")
  );
  const decodedClaims = decode(claimsU8a);

  logger.info("decodedClaims:  " + decodedClaims);
  assert(
    assetDidUri === credential.subject.toLowerCase(),
    `The extracted public credential does not belongs to this assetDID. \n Target: ${assetDidUri} \n Obtained: ${credential.subject}`
  );

  const cTypeId = "kilt:ctype:" + credential.ctypeHash;

  // craft my event ordinal index:
  const publicCredentials = await PublicCredential.getByFields([
    ["creationBlockId", "=", blockNumber],
  ]);
  /** Only counts the number of attestations created on one block.
   * It will not match with the event index from subscan that count all kinds of events.
   */
  const eventIndex = publicCredentials.length;

  const newPublicCredential = PublicCredential.create({
    id: `${blockNumber}-${eventIndex}`,
    credentialHash: credentialID.toHex(),
    objectId: assetDidUri,
    creationBlockId: blockNumber,
    valid: true,
    cTypeId,
    claims: credential.claims,
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

  // There could be several public credentials with the same credential hash.
  // Given that the older ones has been previously removed from the chain state.
  let publicCredentials = await PublicCredential.getByCredentialHash(
    credentialHash
  );

  // Get the publicCredential that is still on the chain state
  let publicCredential = publicCredentials?.find(
    (pubyCreddy) => !pubyCreddy.removalBlockId
  );

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
    assetDidUri === publicCredential.objectId,
    "This Credential does not belong to this Asset-DID"
  );

  publicCredential.valid = false;
  publicCredential.removalBlockId = blockNumber;

  await publicCredential.save();
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

  // There could be several public credentials with the same credential hash.
  // Given that the older ones has been previously removed from the chain state.
  let publicCredentials = await PublicCredential.getByCredentialHash(
    credentialHash
  );

  // Get the publicCredential that is still on the chain state
  let publicCredential = publicCredentials?.find(
    (pubyCreddy) => !pubyCreddy.removalBlockId
  );

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

  // There could be several public credentials with the same credential hash.
  // Given that the older ones has been previously removed from the chain state.
  let publicCredentials = await PublicCredential.getByCredentialHash(
    credentialHash
  );

  // Get the publicCredential that is still on the chain state
  let publicCredential = publicCredentials?.find(
    (pubyCreddy) => !pubyCreddy.removalBlockId
  );

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
