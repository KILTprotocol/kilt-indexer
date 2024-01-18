import type { SubstrateEvent } from "@subql/types";
import { DID } from "../../types";
import assert from "assert";

import { saveBlock } from "../blocks/saveBlock";
import { UNKNOWN } from "../mappingHandlers";

// #[pallet::event]
// #[pallet::generate_deposit(pub(super) fn deposit_event)]
// pub enum Event<T: Config> {
//     /// A new DID has been created.
//     /// \[transaction signer, DID identifier\]
//     DidCreated(AccountIdOf<T>, DidIdentifierOf<T>),
//     /// A DID has been updated.
//     /// \[DID identifier\]
//     DidUpdated(DidIdentifierOf<T>),
//     /// A DID has been deleted.
//     /// \[DID identifier\]
//     DidDeleted(DidIdentifierOf<T>),
//     /// A DID-authorised call has been executed.
//     /// \[DID caller, dispatch result\]
//     DidCallDispatched(DidIdentifierOf<T>, DispatchResult),
// }

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

  const newDID = DID.create({
    id: id,
    payer: payer.toString(),
    creationBlockId: blockNumber,
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

  const did = await DID.get(id);

  assert(did, `Can't find this DID on the data base: ${id}.`);

  did.deletionBlockId = await saveBlock(block);

  await did.save();
}
