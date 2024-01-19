import type { SubstrateEvent } from "@subql/types";
import { Bearer, DID, Web3Name } from "../../types";
import assert from "assert";

import { saveBlock } from "../blocks/saveBlock";
import { createPrehistoricDID } from "../dids/createPrehistoricDID";

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

  logger.info(
    `The whole Web3NameClaimed event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const w3n = "w3n:" + name.toHuman();
  const owner = "did:kilt:" + ownerDID.toString();

  let did = await DID.get(owner);

  // the did (creation) could have happened before the Data base's starting block
  try {
    // TODO: Unwrap the 'assert' and delete the try-catch before deployment. And make 'did' a constant.
    assert(did, `Can't find this DID on the data base: ${did}.`);
  } catch (error) {
    logger.info(error);
    did = await createPrehistoricDID(event);
  }

  // did.web3name ? did.web3name.unshift(w3n) : (did.web3name = [w3n]);

  did.web3name = did.web3name ? [w3n].concat(did.web3name) : [w3n];

  await did.save();

  // Entity:
  let web3Name = await Web3Name.get(w3n);

  if (!web3Name) {
    web3Name = Web3Name.create({
      id: w3n,
      banned: false,
    });
  }

  const previousBearers = await store.getByField("Bearer", "titleId", w3n);

  const bearingData = Bearer.create({
    id: `#${previousBearers.length + 1}_${w3n}`,
    titleId: w3n,
    didId: owner,
    claimBlockId: blockNumber,
  });

  logger.info("previousBearers: " + previousBearers.length);

  await bearingData.save();

  await web3Name.save();
}
