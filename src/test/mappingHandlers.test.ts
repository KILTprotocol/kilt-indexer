import { subqlTest } from "@subql/testing";
import { Block, Did } from "../types";

// See documentation here: https://academy.subquery.network/build/testing.html

/* Template:

subqlTest(
  "testName", // test name
  1000003, // block height to process
  [], // dependent entities
  [], // expected entities
  "handleEvent" //handler name
);
*/

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
  // ], // I don't think this is necessary
  [
    Did.create({
      id: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      creationBlockId: "578009",
      active: true,
    }),
  ], // expected entities
  "handleDidCreated" //handler name
);
//   "deletionBlock": null,
//   "web3NameId": "w3n:socialkyc",

/** This cannot be tested because "saveBlock" is not a listed handler. See:
 *
 *  `Error: Unable to find any datasources that match handler "saveBlock". Please check your project.yaml file.`
 */
// subqlTest(
//   "Tests saving a block", // Test name
//   1060210, // Block height to test at
//   [], // It does not dependent on any entities
//   [
//     Block.create({
//       id: "1060210",
//       hash: "0xf1b38640bd696909769f4a502384892a31b509f9906dcbe7f34f6e02ae3361f8",
//       timeStamp: new Date("2022-02-22T16:56:00.229"),
//     }),
//   ], // Expected entities
//   "saveBlock" // not really a handler, it is only triggered by other handlers
// );
