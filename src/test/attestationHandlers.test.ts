import { subqlTest } from "@subql/testing";
import { Attestation, Block, CType, Did } from "../types";

// See documentation here: https://academy.subquery.network/build/testing.html

subqlTest(
  "handle attestation of first Twitter credential", // test name
  578060, // block height to process
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
      id: "000578060-1",
      claimHash:
        "0x5aa39186774b04dbc7fd71106dfbaf6a9552d751bd7bcbb13848cbdab879daed",
      cTypeId:
        "kilt:ctype:0x47d04c42bdf7fdd3fc5a194bcaa367b2f4766a6b16ae3df628927656d818f420",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: true,
      creationBlockId: "000578060",
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

subqlTest(
  "handle first revocation of attested Email credential", // test name
  3467881, // block height to process
  [
    Did.create({
      id: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      creationBlockId: "000578009",
      active: true,
    }),
    CType.create({
      id: "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      registrationBlockId: "000578015",
      authorId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      definition:
        '{"$schema":"http://kilt-protocol.org/draft-01/ctype#","properties":{"Email":{"type":"string"}},"title":"Email","type":"object"}',
      attestationsCreated: 42,
      attestationsRevoked: 0,
      attestationsRemoved: 0,
      validAttestations: 42,
    }),
    Attestation.create({
      id: "003453935-1",
      claimHash:
        "0xb7b2b2d0c6b93e0072e3fec2eb3aebd01cc129b28390cac049ca26052185235f",
      cTypeId:
        "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: true,
      creationBlockId: "003453935",
      delegationID: undefined,
    }),
  ], // dependent entities
  [
    Attestation.create({
      id: "003453935-1",
      claimHash:
        "0xb7b2b2d0c6b93e0072e3fec2eb3aebd01cc129b28390cac049ca26052185235f",
      cTypeId:
        "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: false,
      creationBlockId: "003453935",
      revocationBlockId: "003467881",
      delegationID: undefined,
    }),
    CType.create({
      id: "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      registrationBlockId: "000578015",
      authorId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      definition:
        '{"$schema":"http://kilt-protocol.org/draft-01/ctype#","properties":{"Email":{"type":"string"}},"title":"Email","type":"object"}',
      attestationsCreated: 42,
      attestationsRevoked: 1,
      attestationsRemoved: 0,
      validAttestations: 41,
    }),
  ], // expected entities
  "handleAttestationRevoked" // handler name
);

subqlTest(
  "handle a removal of an unrevoked Email credential", // test name
  4943775, // block height to process
  [
    Did.create({
      id: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      creationBlockId: "000578009",
      active: true,
    }),
    CType.create({
      id: "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      registrationBlockId: "000578015",
      authorId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      definition:
        '{"$schema":"http://kilt-protocol.org/draft-01/ctype#","properties":{"Email":{"type":"string"}},"title":"Email","type":"object"}',
      attestationsCreated: 42, // mocked numbers
      attestationsRevoked: 0,
      attestationsRemoved: 0,
      validAttestations: 42,
    }),
    Attestation.create({
      id: "004888710-1",
      claimHash:
        "0xf109054b53de36b9dc672d171e5c27d446d4a9203332b6e8dbb7f30d0b09efc1",
      cTypeId:
        "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: true,
      creationBlockId: "004888710",
      delegationID: undefined,
    }),
  ], // dependent entities
  [
    Attestation.create({
      id: "004888710-1",
      claimHash:
        "0xf109054b53de36b9dc672d171e5c27d446d4a9203332b6e8dbb7f30d0b09efc1",
      cTypeId:
        "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: false,
      creationBlockId: "004888710",
      removalBlockId: "004943775",
      delegationID: undefined,
    }),
    CType.create({
      id: "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      registrationBlockId: "000578015",
      authorId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      definition:
        '{"$schema":"http://kilt-protocol.org/draft-01/ctype#","properties":{"Email":{"type":"string"}},"title":"Email","type":"object"}',
      attestationsCreated: 42,
      attestationsRevoked: 0,
      attestationsRemoved: 1,
      validAttestations: 41,
    }),
  ], // expected entities
  "handleAttestationRemoved" // handler name
);
