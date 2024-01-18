import type { SubstrateEvent } from "@subql/types";
import { DID } from "../../types";

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
  // A new DID has been created. [transaction signer, DID identifier\]
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
