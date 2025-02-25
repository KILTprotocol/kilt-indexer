import type { SubstrateEvent } from "@subql/types";
import { Did } from "../../types";
import assert from "assert";

import { saveBlock } from "../blocks/saveBlock";

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

  const did = await Did.get(id);
  assert(did, `Can't find this DID on the data base: ${id}.`);

  did.deletionBlockId = await saveBlock(block);
  did.active = false;

  await did.save();
}

export async function handleDepositOwnerChanged(
  event: SubstrateEvent
): Promise<void> {
  // The balance that is reserved by the current deposit owner will be freed and balance of the new deposit owner will get reserved.
  // \[id: DIDidentifier, from: AccountIdOf, to: AccountIdOf\]
  const {
    block,
    event: {
      data: [identifier, oldOwner, newOwner],
    },
    extrinsic,
  } = event;

  logger.info(`A DID changed it's owner at block ${block.block.header.number}`);

  logger.trace(
    `The whole DepositOwnerChanged event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const id = "did:kilt:" + identifier.toString();

  const did = await Did.get(id);
  assert(did, `Can't find this DID on the data base: ${id}.`);

  did.payer = newOwner.toString();

  await did.save();
}
