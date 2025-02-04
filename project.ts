import {
  SubstrateDatasourceKind,
  SubstrateHandlerKind,
  SubstrateProject,
} from "@subql/types";

import { START_BLOCK, CRAWL_PEREGRINE, RPC_ENDPOINTS } from "./configuration";

// Can expand the Datasource processor types via the generic param
const project: SubstrateProject = {
  specVersion: "1.0.0",
  version: "0.0.2",
  name: CRAWL_PEREGRINE ? "kilt-peregrine-indexer" : "kilt-spiritnet-indexer",
  description:
    "This projects registers and aggregates all identity related events from the KILT network.",
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
    /**
     * This endpoint must be a public non-pruned archive node
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     */
    endpoint: [...RPC_ENDPOINTS.replaceAll(" ", "").split(",")],
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
          /**
           *  `module` refers to the pallet name.
           *  `method` refers to the event emitted.
           */
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
            handler: "handleAttestationDepositOwnerChanged",
            filter: {
              module: "attestation",
              method: "DepositOwnerChanged",
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
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handlePublicCredentialStored",
            filter: {
              module: "publicCredentials",
              method: "CredentialStored",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handlePublicCredentialRemoved",
            filter: {
              module: "publicCredentials",
              method: "CredentialRemoved",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handlePublicCredentialRevoked",
            filter: {
              module: "publicCredentials",
              method: "CredentialRevoked",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handlePublicCredentialUnrevoked",
            filter: {
              module: "publicCredentials",
              method: "CredentialUnrevoked",
            },
          },
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;
