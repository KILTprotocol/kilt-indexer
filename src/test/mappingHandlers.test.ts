import { subqlTest } from "@subql/testing";
import { Block } from "../types";

// See https://academy.subquery.network/build/testing.html

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

/*
// https://academy.subquery.network/build/testing.html
subqlTest(
  "testName", // test name
  1000003, // block height to process
  [], // dependent entities
  [], // expected entities
  "handleEvent" //handler name
);
*/
