## Find all attestation revoked during October 2023:

```
query RevocationEpoch {
  attestations(
    filter: {
      revocationBlock: {
        timeStamp: { greaterThan: "2023-9-30", lessThan: "2023-11-1" }
      }
    }
    orderBy: ID_ASC
  ) {
    totalCount
    nodes {
      ...wholeAttestation
    }
  }
}

fragment wholeBlock on Block{
  id,
  hash,
  timeStamp,
}

fragment wholeAttestation on Attestation {
  id,
  claimHash,
  cTypeId,
  issuerId,
  payer,
  delegationID,
  valid,
  creationBlock {
    ...wholeBlock,
  },
  revocationBlock  {
    ...wholeBlock,
  },
  removalBlock {
    ...wholeBlock,
  },
}
```
