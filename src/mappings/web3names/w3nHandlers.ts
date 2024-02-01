import type { SubstrateEvent } from "@subql/types";
import { Bearer, Did, Sanction, SanctionNature, Web3Name } from "../../types";
import assert from "assert";

import { saveBlock } from "../blocks/saveBlock";
import { createPrehistoricDID } from "../dids/createPrehistoricDID";

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

  let did = await Did.get(owner);

  // the did (creation) could have happened before the Data base's starting block
  try {
    // TODO: Unwrap the 'assert' and delete the try-catch before deployment. And make 'did' a constant.
    assert(did, `Can't find this DID on the data base: ${owner}.`);
  } catch (error) {
    logger.info(error);
    did = await createPrehistoricDID(event);
  }

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
  const previousBearers = (await Bearer.getByNameId(w3n)) || [];

  const bearingData = Bearer.create({
    id: `#${previousBearers.length + 1}_${w3n}`,
    nameId: w3n,
    didId: owner,
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

  logger.info(
    `The whole Web3NameReleased event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const w3n = "w3n:" + name.toHuman();
  const owner = "did:kilt:" + ownerDID.toString();

  let did = await Did.get(owner);

  // the did (creation) could have happened before the Data base's starting block
  try {
    // TODO: Unwrap the 'assert' and delete the try-catch before deployment. And make 'did' a constant.
    assert(did, `Can't find this DID on the data base: ${owner}.`);
  } catch (error) {
    logger.info(error);
    did = await createPrehistoricDID(event);
  }

  did.web3nameId = undefined;
  await did.save();

  // Entity:
  let web3Name = await Web3Name.get(w3n);

  if (!web3Name) {
    // Prehistoric case
    // TODO: delete before deployment and make 'web3name' a constant
    web3Name = Web3Name.create({
      id: w3n,
      banned: false,
    });
  }

  const allBearers = (await Bearer.getByNameId(w3n)) || [];

  if (allBearers.length === 0) {
    // Prehistoric case
    // TODO: delete before deployment
    const prehistoricBearing = Bearer.create({
      id: `#Prehistoric_${w3n}`,
      nameId: w3n,
      didId: owner,
      claimBlockId: blockNumber,
    });
    allBearers.push(prehistoricBearing);
  }

  // Find the bearing title that has not been released yet
  const bearer = allBearers.find((teddy) => !teddy.releaseBlockId);

  assert(bearer, `Can't find the bearer of ${w3n} on the data base.`);

  bearer.releaseBlockId = await saveBlock(block);

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

  logger.info(
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
    // A web3name can be banned before anyone ever claiming it. This also covers the prehistoric case.
    web3Name = Web3Name.create({
      id: w3n,
      banned: false,
    });
  }
  // craft sanction ordinal index:
  const previousSanctions = (await Sanction.getByNameId(w3n)) || [];

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

  logger.info(
    `The whole Web3NameUnbanned event: ${JSON.stringify(
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
    // Prehistoric case
    // TODO: delete before deployment and make 'web3name' a constant
    web3Name = Web3Name.create({
      id: w3n,
      banned: true,
    });
  }

  // craft sanction ordinal index:
  const previousSanctions = (await Sanction.getByNameId(w3n)) || [];

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
