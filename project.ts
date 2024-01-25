import {
  SubstrateDatasourceKind,
  SubstrateHandlerKind,
  SubstrateProject,
} from "@subql/types";

import {
  START_BLOCK,
  CRAWL_PEREGRINE,
  DWELLIR_KEY,
  ONFINALITY_KEY,
} from "./configuration";

// Can expand the Datasource processor types via the generic param
const project: SubstrateProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: CRAWL_PEREGRINE ? "kilt-peregrine-indexer" : "kilt-spiritnet-indexer",
  description:
    "This projects registers (with custom aggregations) all claim types and credential attestations from the KILT network.",
  runner: {
    node: {
      name: "@subql/node",
      version: "*",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    /* The hash of the network genesis block. Block 0 identifier. */
    chainId: CRAWL_PEREGRINE
      ? "0xa0c6e3bac382b316a68bca7141af1fba507207594c761076847ce358aeedcc21" // Falcon Egg
      : "0x411f057b9107718c9624d6aa4a3f23c1653898297f3d4d529d9bb6511a39dd21", // Partially germinated barley
    /* The hash of the network genesis block. Block 0 identifier. */
    /**
     * This endpoint must be a public non-pruned archive node
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     * You can get them from OnFinality for free https://app.onfinality.io
     * https://documentation.onfinality.io/support/the-enhanced-api-service
     */
    endpoint: CRAWL_PEREGRINE
      ? [PRIVATE_NODE ? "ws://localhost:1821" : "wss://peregrine.kilt.io"]
      : [
          DWELLIR_KEY
            ? `wss://kilt-rpc.dwellir.com/${DWELLIR_KEY}`
            : "wss://kilt-rpc.dwellir.com",
          ONFINALITY_KEY
            ? `wss://spiritnet.api.onfinality.io/ws?apikey=${ONFINALITY_KEY}`
            : "wss://spiritnet.api.onfinality.io/public-ws",
        ],
    // Optionally provide the HTTP endpoint of a full chain dictionary to speed up processing
    dictionary:
      "https://api.subquery.network/sq/subquery/kilt-spiritnet-dictionary",
    chaintypes: {
      file: "./dist/chaintypes.js",
    },
  },
  dataSources: [
    {
      kind: SubstrateDatasourceKind.Runtime,
      startBlock: START_BLOCK,
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            handler: "handleAttestationCreated",
            kind: SubstrateHandlerKind.Event,
            filter: {
              module: "attestation",
              method: "AttestationCreated",
            },
          },
          {
            handler: "handleAttestationRevoked",
            kind: SubstrateHandlerKind.Event,
            filter: {
              module: "attestation",
              method: "AttestationRevoked",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleAttestationRemoved",
            filter: {
              module: "attestation",
              method: "AttestationRemoved",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleAttestationDepositReclaimed",
            filter: {
              module: "attestation",
              method: "DepositReclaimed",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleAttestationDepositReclaimed",
            filter: {
              module: "attestation",
              method: "DepositReclaimed",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleCTypeCreated",
            filter: {
              module: "ctype",
              method: "CTypeCreated",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleDidCreated",
            filter: {
              module: "did",
              method: "DidCreated",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleDidDeleted",
            filter: {
              module: "did",
              method: "DidDeleted",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleWeb3NameClaimed",
            filter: {
              module: "web3Names",
              method: "Web3NameClaimed",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleWeb3NameReleased",
            filter: {
              module: "web3Names",
              method: "Web3NameReleased",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleWeb3NameBanned",
            filter: {
              module: "web3Names",
              method: "Web3NameBanned",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleWeb3NameUnbanned",
            filter: {
              module: "web3Names",
              method: "Web3NameUnbanned",
            },
          },
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;
