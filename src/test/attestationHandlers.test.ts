import { subqlTest } from "@subql/testing";
import { Attestation, Block, CType, Did } from "../types";

// See documentation here: https://academy.subquery.network/build/testing.html

subqlTest(
  "handle attestation of first Twitter credential", // test name
  1004586, // block height to process
  [
    Did.create({
      id: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      creationBlockId: "000578009",
      active: true,
    }),
    CType.create({
      id: "kilt:ctype:0x47d04c42bdf7fdd3fc5a194bcaa367b2f4766a6b16ae3df628927656d818f420",
      registrationBlockId: "000578018",
      authorId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      definition:
        '{"$schema":"http://kilt-protocol.org/draft-01/ctype#","properties":{"Twitter":{"type":"string"}},"title":"Twitter","type":"object"}',
      attestationsCreated: 0,
      attestationsRevoked: 0,
      attestationsRemoved: 0,
      validAttestations: 0,
    }),
  ], // dependent entities
  [
    Attestation.create({
      id: "001004586-1",
      claimHash:
        "0xbd12e7068a0b85feda9cc917da710e54d77395af4b1127c99e9efe143c54c9f4",
      cTypeId:
        "kilt:ctype:0x47d04c42bdf7fdd3fc5a194bcaa367b2f4766a6b16ae3df628927656d818f420",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: true,
      creationBlockId: "001004586",
      delegationID: undefined,
    }),
    CType.create({
      id: "kilt:ctype:0x47d04c42bdf7fdd3fc5a194bcaa367b2f4766a6b16ae3df628927656d818f420",
      registrationBlockId: "000578018",
      authorId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      definition:
        '{"$schema":"http://kilt-protocol.org/draft-01/ctype#","properties":{"Twitter":{"type":"string"}},"title":"Twitter","type":"object"}',
      attestationsCreated: 1,
      attestationsRevoked: 0,
      attestationsRemoved: 0,
      validAttestations: 1,
    }),
  ], // expected entities
  "handleAttestationCreated" // handler name
);
