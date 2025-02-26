import { subqlTest } from "@subql/testing";
import { Block, Did } from "../types";

subqlTest(
  "handle saving first block related to Identity", // Test name
  312677, // Block height to test at
  [], // It does not dependent on any entities
  [
    Block.create({
      id: 312677,
      hash: "0x76389b4bf519b14df346755133906e8b7e29587cbde7f729b47d9ad7f94979af",
      timeStamp: new Date("2021-10-28T14:30:24.37"),
    }) as any,
  ], // Expected entities
  "handleDidCreated" // handler name that triggers it
);

subqlTest(
  "handle creation of socialKYC DID", // test name
  578009, // block height to process

  [], // dependent entities
  // [
  //   Block.create({
  //     id: "578009",
  //     hash: "0x05582a62360a194e2a2d64d7ca7fb96f11a46c9d9dbc5d2f4adec41cf6f0e525",
  //     timeStamp: new Date("2021-12-09T13:21:12.464"),
  //   }),
  // ], // It is not necessary, it gets created by the handler function.
  [
    Did.create({
      id: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      creationBlockId: 578009,
      active: true,
    }),
  ], // expected entities
  "handleDidCreated" //handler name
);
//   "deletionBlock": null,
//   "web3NameId": "w3n:socialkyc",

subqlTest(
  "handle DID deletion", // test name
  1038890, // block height to process
  [
    Block.create({
      id: 1038495,
      hash: "0xcf259c39be26fc12b5015094c15f887f5e04723bc70cf2add223398fa7ae4cd5",
      timeStamp: new Date("2022-02-17T10:52:00.211"),
    }) as any,
    Did.create({
      id: "did:kilt:4sddCVdkFajMKtG5unJmquP5Fcrw4A5bfbEkrCEQvkCp7iCx",
      payer: "4tAV8xD2id6EC5V7CaHAiix3mAFzvkCHKa26BykAxaAhGu4y",
      creationBlockId: 1038495,
      active: true,
    }),
  ], // dependent entities
  [
    Did.create({
      id: "did:kilt:4sddCVdkFajMKtG5unJmquP5Fcrw4A5bfbEkrCEQvkCp7iCx",
      payer: "4tAV8xD2id6EC5V7CaHAiix3mAFzvkCHKa26BykAxaAhGu4y",
      creationBlockId: 1038495,
      deletionBlockId: 1038890,
      active: false,
    }),
  ], // expected entities
  "handleDidDeleted" //handler name
);
