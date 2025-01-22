import { subqlTest } from "@subql/testing";
import { Did, Ownership, Web3Name } from "../types";

subqlTest(
  "handle the first web3name being claimed", // test name
  1189457, // block height to process
  [
    Did.create({
      id: "did:kilt:4tV2uXwJo2pHg4YS4dpmPJpMKryTK5KUauHoH18BjUBBadLr",
      payer: "4oKx7RycScwUAcCPVSUBdU1GspTMZUVn4WuxsRtJ8FXZvWSw",
      creationBlockId: "001126458",
      active: true,
    }),
  ], // dependent entities
  [
    Web3Name.create({
      id: "w3n:ntn_x2",
      banned: false,
    }),
    Ownership.create({
      id: "#1_w3n:ntn_x2",
      nameId: "w3n:ntn_x2",
      bearerId: "did:kilt:4tV2uXwJo2pHg4YS4dpmPJpMKryTK5KUauHoH18BjUBBadLr",
      claimBlockId: "001189457",
    }),
  ], // expected entities
  "handleWeb3NameClaimed" // handler name
);
