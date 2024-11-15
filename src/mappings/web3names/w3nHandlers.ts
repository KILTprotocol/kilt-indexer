import type { SubstrateEvent } from "@subql/types";
import {
  Ownership,
  Did,
  Sanction,
  SanctionNature,
  Web3Name,
} from "../../types";
import assert from "assert";

import { saveBlock } from "../blocks/saveBlock";

const getterOptions = { limit: 1000 };

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

  logger.trace(
    `The whole Web3NameClaimed event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const w3n = "w3n:" + name.toHuman();
  const owner = "did:kilt:" + ownerDID.toString();

  const did = await Did.get(owner);
  assert(did, `Can't find this DID on the data base: ${owner}.`);
  did.web3nameId = w3n;
  await did.save();

  // Entity:
  let web3Name = await Web3Name.get(w3n);

  if (!web3Name) {
    web3Name = Web3Name.create({
      id: w3n,
      banned: false,
    });
  }
  // craft bearers ordinal index:
  const previousBearers =
    (await Ownership.getByNameId(w3n, getterOptions)) || [];

  const bearingData = Ownership.create({
    id: `#${previousBearers.length + 1}_${w3n}`,
    nameId: w3n,
    bearerId: owner,
    claimBlockId: blockNumber,
  });

  await bearingData.save();

  await web3Name.save();
}

export async function handleWeb3NameReleased(
  event: SubstrateEvent
): Promise<void> {
  // A name has been released. \[owner, name\]
  const {
    block,
    event: {
      data: [ownerDID, name],
    },
    extrinsic,
  } = event;

  logger.info(
    `A web3-name has been released at block ${block.block.header.number}`
  );

  logger.trace(
    `The whole Web3NameReleased event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const w3n = "w3n:" + name.toHuman();
  const owner = "did:kilt:" + ownerDID.toString();

  const did = await Did.get(owner);
  assert(did, `Can't find this DID on the data base: ${owner}.`);
  did.web3nameId = undefined;
  await did.save();

  // Entity:
  const web3Name = await Web3Name.get(w3n);
  assert(web3Name, `Can't find this web3Name on the data base: ${w3n}.`);

  const allBearers = (await Ownership.getByNameId(w3n, getterOptions)) || [];

  // Find the bearing title that has not been released yet
  const bearer = allBearers.find((teddy) => !teddy.releaseBlockId);

  assert(bearer, `Can't find the bearer of ${w3n} on the data base.`);

  bearer.releaseBlockId = blockNumber;

  await bearer.save();

  await web3Name.save();
}

export async function handleWeb3NameBanned(
  event: SubstrateEvent
): Promise<void> {
  // A name has been banned. \[name\]
  const {
    block,
    event: {
      data: [name],
    },
    extrinsic,
  } = event;

  logger.info(
    `A web3-name has been banned at block ${block.block.header.number}`
  );

  logger.trace(
    `The whole Web3NameBanned event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const w3n = "w3n:" + name.toHuman();

  // Entity:
  let web3Name = await Web3Name.get(w3n);

  if (!web3Name) {
    // A web3name can be banned before anyone ever claiming it.
    web3Name = Web3Name.create({
      id: w3n,
      banned: false,
    });
  }
  // craft sanction ordinal index:
  const previousSanctions =
    (await Sanction.getByNameId(w3n, getterOptions)) || [];

  const newSanction = Sanction.create({
    id: `§${previousSanctions.length + 1}_${w3n}`,
    nameId: w3n,
    nature: SanctionNature.prohibition,
    enforcementBlockId: blockNumber,
  });

  await newSanction.save();

  web3Name.banned = true;

  await web3Name.save();

  // If a did owned this web3Name at the moment of the ban, a Web3NameReleased event would be release.
  // So, no extra logic for the dids inside of this handler is needed.
}

export async function handleWeb3NameUnbanned(
  event: SubstrateEvent
): Promise<void> {
  // A name has been unbanned. \[name\]
  const {
    block,
    event: {
      data: [name],
    },
    extrinsic,
  } = event;

  logger.info(
    `A web3-name has been unbanned at block ${block.block.header.number}`
  );

  logger.trace(
    `The whole Web3NameUnbanned event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const w3n = "w3n:" + name.toHuman();

  // Entity:
  const web3Name = await Web3Name.get(w3n);
  assert(web3Name, `Can't find this web3Name on the data base: ${w3n}.`);

  // craft sanction ordinal index:
  const previousSanctions =
    (await Sanction.getByNameId(w3n, getterOptions)) || [];

  const newSanction = Sanction.create({
    id: `§${previousSanctions.length + 1}_${w3n}`,
    nameId: w3n,
    nature: SanctionNature.permission,
    enforcementBlockId: blockNumber,
  });

  await newSanction.save();

  web3Name.banned = false;

  await web3Name.save();
}
