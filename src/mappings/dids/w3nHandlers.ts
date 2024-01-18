import type { SubstrateEvent } from "@subql/types";
import { DID } from "../../types";
import assert from "assert";

import { saveBlock } from "../blocks/saveBlock";
import { createPrehistoricDID } from "./createPrehistoricDID";

// #[pallet::event]
// #[pallet::generate_deposit(pub(super) fn deposit_event)]
// pub enum Event<T: Config> {
//     /// A new name has been claimed.
//     Web3NameClaimed {
//         owner: Web3NameOwnerOf<T>,
//         name: Web3NameOf<T>,
//     },
//     /// A name has been released.
//     Web3NameReleased {
//         owner: Web3NameOwnerOf<T>,
//         name: Web3NameOf<T>,
//     },
//     /// A name has been banned.
//     Web3NameBanned { name: Web3NameOf<T> },
//     /// A name has been unbanned.
//     Web3NameUnbanned { name: Web3NameOf<T> },
// }

export async function handleWeb3NameClaimed(
  event: SubstrateEvent
): Promise<void> {
  // A new name has been claimed. \[owner, name\]
  const {
    block,
    event: {
      data: [ownerDID, name],
    },
    extrinsic,
  } = event;

  logger.info(
    `A web3-name has been claimed at block ${block.block.header.number}`
  );

  logger.logger(
    `The whole Web3NameClaimed event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const w3n = "w3n:" + name.toString();
  const owner = "did:kilt:" + ownerDID.toString();

  logger.info("owner: " + owner);

  let did = await DID.get(owner);
  assert(did, `Can't find this DID on the data base: ${w3n}.`);

  // the did (creation) could have happened before the Data base's starting block
  try {
    // TODO: Unwrap the 'assert' and delete the try-catch before deployment. And make 'did' a constant.
    assert(did, `Can't find this DID on the data base: ${w3n}.`);
  } catch (error) {
    logger.info(error);
    did = await createPrehistoricDID(event);
  }

  // did.web3name ? did.web3name.unshift(w3n) : (did.web3name = [w3n]);

  did.web3name = did.web3name ? [w3n].concat(did.web3name) : [w3n];

  // did.web3name = w3n;
  logger.info("did.web3name " + did.web3name);
  await did.save();
}
