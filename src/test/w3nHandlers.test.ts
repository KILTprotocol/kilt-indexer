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

subqlTest(
  "handle the Antonio's web3name being released", // test name
  2775720, // block height to process
  [
    Did.create({
      id: "did:kilt:4tV2uXwJo2pHg4YS4dpmPJpMKryTK5KUauHoH18BjUBBadLr",
      payer: "4oKx7RycScwUAcCPVSUBdU1GspTMZUVn4WuxsRtJ8FXZvWSw",
      creationBlockId: "001126458",
      active: true,
      web3nameId: "w3n:ntn_x2",
    }),
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
  ], // dependent entities
  [
    Ownership.create({
      id: "#1_w3n:ntn_x2",
      nameId: "w3n:ntn_x2",
      bearerId: "did:kilt:4tV2uXwJo2pHg4YS4dpmPJpMKryTK5KUauHoH18BjUBBadLr",
      claimBlockId: "001189457",
      releaseBlockId: "002775720",
    }),
    Did.create({
      id: "did:kilt:4tV2uXwJo2pHg4YS4dpmPJpMKryTK5KUauHoH18BjUBBadLr",
      payer: "4oKx7RycScwUAcCPVSUBdU1GspTMZUVn4WuxsRtJ8FXZvWSw",
      creationBlockId: "001126458",
      active: true,
      web3nameId: undefined,
    }),
  ], // expected entities
  "handleWeb3NameReleased" // handler name
);

// TODO: Add tests for "handleWeb3NameBanned" and "handleWeb3NameUnbanned" after they happen on the production chain
