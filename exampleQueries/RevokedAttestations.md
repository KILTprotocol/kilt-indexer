## Find all revoked attestations:

```
query RevokedAttestations {
  attestations(filter: { revocationBlockId: { isNull: false } }) {
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
