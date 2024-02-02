import type { SubstrateEvent } from "@subql/types";
import { Did } from "../../types";
import assert from "assert";

import { saveBlock } from "../blocks/saveBlock";
import { createPrehistoricDID } from "./createPrehistoricDID";

export async function handleDidCreated(event: SubstrateEvent): Promise<void> {
  // A new DID has been created. \[transaction signer, DID identifier\]
  const {
    block,
    event: {
      data: [payer, identifier],
    },
    extrinsic,
  } = event;

  logger.info(`New DID registered at block ${block.block.header.number}`);

  logger.trace(
    `The whole DidCreated event: ${JSON.stringify(event.toHuman(), null, 2)}`
  );

  const blockNumber = await saveBlock(block);
  const id = "did:kilt:" + identifier.toString();

  const newDID = Did.create({
    id: id,
    payer: payer.toString(),
    creationBlockId: blockNumber,
    active: true,
  });

  await newDID.save();
}

export async function handleDidDeleted(event: SubstrateEvent): Promise<void> {
  // A DID has been deleted. \[DID identifier\]
  const {
    block,
    event: {
      data: [identifier],
    },
    extrinsic,
  } = event;

  logger.info(`A DID was deactivated at block ${block.block.header.number}`);

  logger.trace(
    `The whole DidDeleted event: ${JSON.stringify(event.toHuman(), null, 2)}`
  );

  const id = "did:kilt:" + identifier.toString();

  let did = await Did.get(id);

  // the did (creation) could have happened before the Data base's starting block
  try {
    // TODO: Unwrap the 'assert' and delete the try-catch before deployment. And make 'did' a constant.
    assert(did, `Can't find this DID on the data base: ${id}.`);
  } catch (error) {
    logger.info(error);
    did = await createPrehistoricDID(event);
  }

  did.deletionBlockId = await saveBlock(block);
  did.active = false;

  await did.save();
}
