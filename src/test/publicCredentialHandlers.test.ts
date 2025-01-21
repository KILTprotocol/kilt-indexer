import { subqlTest } from "@subql/testing";
import {
  Asset,
  AssetDID,
  Chain,
  PublicCredential,
  Update,
  UpdateNature,
} from "../types";

subqlTest(
  "handle storing only first Public Credential", // test name
  3209405, // block height to process
  [], // dependent entities
  [
    PublicCredential.create({
      id: "0x8e723085fadccc58e959f984a46d7c1487c3eceb7d73bf76803223c9efafa660",
      subjectId:
        "did:asset:eip155:1.erc721:0xac5c7493036de60e63eb81c5e9a440b42f47ebf5:4217",
      valid: true,
      cTypeId:
        "kilt:ctype:0x3228451c231f002227358f90c31436ea6e302d53e3ae45903c49ebc45d6b9b19",
      claims: "0x7b22617765736f6d65223a203130307d",
      issuerId: "did:kilt:4siDmerNEBREZJsFoLM95x6cxEho73bCWKEDAXrKdou4a3mH",
      delegationID: undefined,
    }),
  ], // expected entities
  "handlePublicCredentialStored" // handler name
);

subqlTest(
  "handle storing first Public Credential and related AssetDID, Chain, Asset and Update ", // test name
  3209405, // block height to process
  [], // dependent entities
  [
    PublicCredential.create({
      id: "0x8e723085fadccc58e959f984a46d7c1487c3eceb7d73bf76803223c9efafa660",
      subjectId:
        "did:asset:eip155:1.erc721:0xac5c7493036de60e63eb81c5e9a440b42f47ebf5:4217",
      valid: true,
      cTypeId:
        "kilt:ctype:0x3228451c231f002227358f90c31436ea6e302d53e3ae45903c49ebc45d6b9b19",
      claims: "0x7b22617765736f6d65223a203130307d",
      issuerId: "did:kilt:4siDmerNEBREZJsFoLM95x6cxEho73bCWKEDAXrKdou4a3mH",
      delegationID: undefined,
    }),
    Chain.create({
      id: "eip155:1",
      namespace: "eip155",
      reference: "1",
    }),
    Asset.create({
      id: "erc721:0xac5c7493036de60e63eb81c5e9a440b42f47ebf5:4217",
      namespace: "erc721",
      reference: "0xac5c7493036de60e63eb81c5e9a440b42f47ebf5",
      identifier: "4217",
    }),
    AssetDID.create({
      id: "did:asset:eip155:1.erc721:0xac5c7493036de60e63eb81c5e9a440b42f47ebf5:4217",
      chainId: "eip155:1",
      assetId: "erc721:0xac5c7493036de60e63eb81c5e9a440b42f47ebf5:4217",
    }),
    Update.create({
      id: "§1_0x8e723085fadccc58e959f984a46d7c1487c3eceb7d73bf76803223c9efafa660",
      credentialId:
        "0x8e723085fadccc58e959f984a46d7c1487c3eceb7d73bf76803223c9efafa660",
      nature: UpdateNature.creation,
      updateBlockId: "003209405",
    }),
  ], // expected entities
  "handlePublicCredentialStored" // handler name
);
