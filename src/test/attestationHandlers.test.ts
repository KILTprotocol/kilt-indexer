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
  "handle first revocation of an attested Email credential", // test name
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

subqlTest(
  "handle a removal of a revoked Email credential", // test name
  4943884, // block height to process
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
      attestationsRevoked: 1,
      attestationsRemoved: 0,
      validAttestations: 41,
    }),
    Attestation.create({
      id: "004943834-1",
      claimHash:
        "0x650ada4d02c5e37e523da108f255c38fac0fec5cc3b7fd18d97322dddc731a1e",
      cTypeId:
        "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: false,
      creationBlockId: "004943834",
      revocationBlockId: "004943869",
      delegationID: undefined,
    }),
  ], // dependent entities
  [
    Attestation.create({
      id: "004943834-1",
      claimHash:
        "0x650ada4d02c5e37e523da108f255c38fac0fec5cc3b7fd18d97322dddc731a1e",
      cTypeId:
        "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: false,
      creationBlockId: "004943834",
      revocationBlockId: "004943869",
      removalBlockId: "004943884",
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
      attestationsRemoved: 1,
      validAttestations: 41,
    }),
  ], // expected entities
  "handleAttestationRemoved" // handler name
);

subqlTest(
  "handle removal of credentials by reclaiming the deposit ", // test name
  1843373, // block height to process
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
      id: "001831761-1",
      claimHash:
        "0xd5b324433e490315e62dd90dbdc003a0fff693014d76566a2f30543a6672825e",
      cTypeId:
        "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: true,
      creationBlockId: "001831761",
      delegationID: undefined,
    }),

    Attestation.create({
      id: "001831753-1",
      claimHash:
        "0xeacd5f8bd3950861b0477962a1780289cd05f017e9ed2cc482aa18610027cd7c",
      cTypeId:
        "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: true,
      creationBlockId: "001831753",
      delegationID: undefined,
    }),
    Attestation.create({
      id: "001831726-1",
      claimHash:
        "0xd29f8295e227407868953e8818a8c80dbddc0851bfdf3c57d4d54caf3aa3048e",
      cTypeId:
        "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: true,
      creationBlockId: "001831726",
      delegationID: undefined,
    }),
    Attestation.create({
      id: "001832597-1",
      claimHash:
        "0x8f03f7e7e1782ec29291ae9d5250792efc5456a3f24c5b9dda4c782a17609b64",
      cTypeId:
        "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: true,
      creationBlockId: "001832597",
      delegationID: undefined,
    }),
  ], // dependent entities
  [
    CType.create({
      id: "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      registrationBlockId: "000578015",
      authorId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      definition:
        '{"$schema":"http://kilt-protocol.org/draft-01/ctype#","properties":{"Email":{"type":"string"}},"title":"Email","type":"object"}',
      attestationsCreated: 42,
      attestationsRevoked: 0,
      attestationsRemoved: 4,
      validAttestations: 38,
    }),

    Attestation.create({
      id: "001831761-1",
      claimHash:
        "0xd5b324433e490315e62dd90dbdc003a0fff693014d76566a2f30543a6672825e",
      cTypeId:
        "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: false,
      creationBlockId: "001831761",
      removalBlockId: "001843373",
      delegationID: undefined,
    }),

    Attestation.create({
      id: "001831753-1",
      claimHash:
        "0xeacd5f8bd3950861b0477962a1780289cd05f017e9ed2cc482aa18610027cd7c",
      cTypeId:
        "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: false,
      creationBlockId: "001831753",
      removalBlockId: "001843373",
      delegationID: undefined,
    }),
    Attestation.create({
      id: "001831726-1",
      claimHash:
        "0xd29f8295e227407868953e8818a8c80dbddc0851bfdf3c57d4d54caf3aa3048e",
      cTypeId:
        "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: false,
      creationBlockId: "001831726",
      removalBlockId: "001843373",
      delegationID: undefined,
    }),
    Attestation.create({
      id: "001832597-1",
      claimHash:
        "0x8f03f7e7e1782ec29291ae9d5250792efc5456a3f24c5b9dda4c782a17609b64",
      cTypeId:
        "kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac",
      issuerId: "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare",
      payer: "4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW",
      valid: false,
      creationBlockId: "001832597",
      removalBlockId: "001843373",
      delegationID: undefined,
    }),
  ], // expected entities
  "handleAttestationDepositReclaimed" // handler name
);
