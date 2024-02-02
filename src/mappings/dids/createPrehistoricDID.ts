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
  });

  await prehistoricDID.save();

  return prehistoricDID;
}
