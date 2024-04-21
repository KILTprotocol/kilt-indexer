import type { SubstrateEvent } from "@subql/types";
import { Did } from "../../types";
import { saveBlock } from "../blocks/saveBlock";
import { UNKNOWN } from "../mappingHandlers";

/** Solves problems while trying to start Data Base from higher block.
 *
 * TODO: This function should be deleted before deployment.
 *
 * @param event a DID deletion.
 */
export async function createPrehistoricDID(
  event: SubstrateEvent
): Promise<Did> {
  logger.info(
    `A DID from before the Database's startBlock is being added with default values.`
  );

  // A DID has been deleted. \[DID identifier\]
  // A new name has been claimed. \[owner, name\]
  // A name has been released. \[owner, name\]
  // A new attestation has been created.\[attester DID, claim hash, CType hash, (optional) delegation ID\]
  // An attestation has been revoked.\[attester DID, claim hash\]
  // An attestation has been removed.\[attester DID, claim hash\]
  // A new CType has been created.\[creator identifier, CType hash\]
  const {
    block,
    event: {
      data: [identifier],
    },
    extrinsic,
  } = event;

  logger.trace(
    `The whole event involving a prehistoric did: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const id = "did:kilt:" + identifier.toString();
  const payer = UNKNOWN;

  const prehistoricDID = Did.create({
    id: id,
    payer: payer,
    creationBlockId: blockNumber,
    active: true,
  });

  await prehistoricDID.save();

  return prehistoricDID;
}
