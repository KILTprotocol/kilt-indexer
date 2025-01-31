import { subqlTest } from "@subql/testing";
import { Block, CType, Did } from "../types";

// See documentation here: https://academy.subquery.network/build/testing.html

subqlTest(
  "handle creation of first Email cType by socialKYC", // test name
  578015, // block height to process
  [
    Did.create({
      id: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      creationBlockId: "000578009",
      active: true,
    }),
  ], // dependent entities
  [
    CType.create({
      id: "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      registrationBlockId: "000578015",
      authorId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      definition:
        '{"$schema":"http://kilt-protocol.org/draft-01/ctype#","properties":{"Email":{"type":"string"}},"title":"Email","type":"object"}',
      attestationsCreated: 0,
      attestationsRevoked: 0,
      attestationsRemoved: 0,
      validAttestations: 0,
    }),
  ], // expected entities
  "handleCTypeCreated" // handler name
);
