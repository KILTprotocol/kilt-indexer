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
  "handle storing only a Public Credential and it's Update", // test name
  3282040, // block height to process
  [], // dependent entities
  [
    PublicCredential.create({
      id: "0x9d54d4a7ee436b862ea0479a9472ef11901f566691abdf52193e2ad77490fcb8",
      subjectId:
        "did:asset:eip155:5.erc721:0x317a8fe0f1c7102e7674ab231441e485c64c178a:110166",
      valid: true,
      cTypeId:
        "kilt:ctype:0x6f20af20bbae5b280fb4a4768963236730ad7e8213f36d6f3899871cb04c9ae6",
      claims: "0xa1646c696b65f5",
      issuerId: "did:kilt:4qp1t66kuBFMDBxAoJdYAfxPb1XEhMss9QV7gysNx5CUJtTB",
      delegationID: undefined,
    }),
    Update.create({
      id: "§1_0x9d54d4a7ee436b862ea0479a9472ef11901f566691abdf52193e2ad77490fcb8",
      credentialId:
        "0x9d54d4a7ee436b862ea0479a9472ef11901f566691abdf52193e2ad77490fcb8",
      nature: UpdateNature.creation,
      updateBlockId: "003282040",
    }),
  ], // expected entities
  "handlePublicCredentialStored" // handler name
);

subqlTest(
  "handle storing first Public Credential and related (Ethereum) AssetDID, Chain, Asset and Update ", // test name
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

subqlTest(
  "handle storing first Public Credential and related (Polkadot) AssetDID, Chain, Asset and Update ", // test name
  3350575, // block height to process
  [], // dependent entities
  [
    PublicCredential.create({
      id: "0x0a7930eb76f0231b5fe286fb0174c37f5a8d33974ab407cf8a11e045c47665e3",
      subjectId:
        "did:asset:polkadot:411f057b9107718c9624d6aa4a3f23c1.att:kilt-public-credential-v1:0xfbf954420d182c38812521d5bd21d9b95e20dc1e046537fdc441780808994c86",
      valid: true,
      cTypeId:
        "kilt:ctype:0x6f20af20bbae5b280fb4a4768963236730ad7e8213f36d6f3899871cb04c9ae6",
      claims: "0xa1646c696b65f5",
      issuerId: "did:kilt:4spSZH48eW2czvqyNQoh9jNajRPrTUyJph1FZaYoFP23D7qd",
      delegationID: undefined,
    }),
    Chain.create({
      id: "polkadot:411f057b9107718c9624d6aa4a3f23c1",
      namespace: "polkadot",
      reference: "411f057b9107718c9624d6aa4a3f23c1",
    }),
    Asset.create({
      id: "att:kilt-public-credential-v1:0xfbf954420d182c38812521d5bd21d9b95e20dc1e046537fdc441780808994c86",
      namespace: "att",
      reference: "kilt-public-credential-v1",
      identifier:
        "0xfbf954420d182c38812521d5bd21d9b95e20dc1e046537fdc441780808994c86",
    }),
    AssetDID.create({
      id: "did:asset:polkadot:411f057b9107718c9624d6aa4a3f23c1.att:kilt-public-credential-v1:0xfbf954420d182c38812521d5bd21d9b95e20dc1e046537fdc441780808994c86",
      chainId: "polkadot:411f057b9107718c9624d6aa4a3f23c1",
      assetId:
        "att:kilt-public-credential-v1:0xfbf954420d182c38812521d5bd21d9b95e20dc1e046537fdc441780808994c86",
    }),
    Update.create({
      id: "§1_0x0a7930eb76f0231b5fe286fb0174c37f5a8d33974ab407cf8a11e045c47665e3",
      credentialId:
        "0x0a7930eb76f0231b5fe286fb0174c37f5a8d33974ab407cf8a11e045c47665e3",
      nature: UpdateNature.creation,
      updateBlockId: "003350575",
    }),
  ], // expected entities
  "handlePublicCredentialStored" // handler name
);

subqlTest(
  "handle saving a (Polkadot) AssetDID, Chain and Asset ", // test name
  3350575, // block height to process
  [], // dependent entities
  [
    Chain.create({
      id: "polkadot:411f057b9107718c9624d6aa4a3f23c1",
      namespace: "polkadot",
      reference: "411f057b9107718c9624d6aa4a3f23c1",
    }),
    Asset.create({
      id: "att:kilt-public-credential-v1:0xfbf954420d182c38812521d5bd21d9b95e20dc1e046537fdc441780808994c86",
      namespace: "att",
      reference: "kilt-public-credential-v1",
      identifier:
        "0xfbf954420d182c38812521d5bd21d9b95e20dc1e046537fdc441780808994c86",
    }),
    AssetDID.create({
      id: "did:asset:polkadot:411f057b9107718c9624d6aa4a3f23c1.att:kilt-public-credential-v1:0xfbf954420d182c38812521d5bd21d9b95e20dc1e046537fdc441780808994c86",
      chainId: "polkadot:411f057b9107718c9624d6aa4a3f23c1",
      assetId:
        "att:kilt-public-credential-v1:0xfbf954420d182c38812521d5bd21d9b95e20dc1e046537fdc441780808994c86",
    }),
  ], // expected entities
  "handlePublicCredentialStored" // handler name
);

// TODO: Add tests for "handlePublicCredentialRemoved", "handlePublicCredentialRevoked" and "handlePublicCredentialUnrevoked" after they happen on the production chain
