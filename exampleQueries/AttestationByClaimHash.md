## Find Attestation by its claim hash:

_taking advantage of fragments:_

```
query {
  attestations(
    filter: {
      claimHash: {
        equalTo: "0x7554dc0b69be9bd6a266c865a951cae6a168c98b8047120dd8904ad54df5bb08"
      }
    }
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
