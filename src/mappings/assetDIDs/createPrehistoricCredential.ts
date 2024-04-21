import type { SubstrateEvent } from "@subql/types";
import { Codec } from "@polkadot/types-codec/types";
import { Did, PublicCredential } from "../../types";
import { saveBlock } from "../blocks/saveBlock";
import { UNKNOWN } from "../mappingHandlers";
import { saveAssetDid } from "./saveAssetDid";
import { createPrehistoricAssetDid } from "./createPrehistoricAssetDid";
import { createPrehistoricCType } from "../cTypes/createPrehistoricCType";
import { KiltAssetDidsV1AssetDid } from "@kiltprotocol/augment-api";

/** Solves problems while trying to start Data Base from higher block.
 *
 * TODO: This function should be deleted before deployment.
 *
 * @param event a Public Credential removal/revocation/un-revocation.
 */
export async function createPrehistoricCredential(
  event: SubstrateEvent
): Promise<PublicCredential> {
  logger.info(
    `A Public Credential from before the Database's startBlock is being added with default values.`
  );

  // A public credentials has been removed. \[subject_id, credential_id\]
  // A public credential has been revoked. \[credential_id\]
  // A public credential has been unrevoked. \[credential_id\]
  const {
    block,
    event: {
      data: [argument1, argument2],
    },
    extrinsic,
  } = event;

  // `argument1` could be 'subject_id' or 'credential_id'
  // `argument2` could be 'credential_id' or undefined

  logger.info(
    `The whole event involving a prehistoric public credential: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const credentialID: Codec = argument2 ?? argument1;
  const credentialHash = credentialID.toHex();

  const blockNumber = await saveBlock(block);

  // If the subject_id is not on the event, need to create a prehistoric assetDID
  const assetDidUri = argument2
    ? await saveAssetDid(argument1 as KiltAssetDidsV1AssetDid)
    : await createPrehistoricAssetDid();

  // need a prehistoric did
  const didId = "did:kilt:" + UNKNOWN;

  let prehistoricDID = await Did.get(didId);
  if (!prehistoricDID) {
    prehistoricDID = Did.create({
      id: didId,
      payer: UNKNOWN,
      creationBlockId: blockNumber,
      active: true,
    });

    await prehistoricDID.save();
  }

  const prehistoricCType = await createPrehistoricCType(blockNumber);

  const prehistoricCredential = PublicCredential.create({
    id: credentialHash,
    subjectId: assetDidUri,
    valid: true,
    cTypeId: prehistoricCType.id,
    claims: UNKNOWN,
    issuerId: prehistoricDID.id,
    delegationID: UNKNOWN,
  });

  await prehistoricCredential.save();

  // No creation Update for prehistoric Credentials

  return prehistoricCredential;
}
