## Find all cTypes that have been used at least once:

```
query UsedCTypes {
  cTypes(
    filter: { attestations: { some: { id: { isNull: false } } } }
    orderBy: ATTESTATIONS_COUNT_DESC
  ) {
    totalCount
    nodes {
      id
      author {
     ...DidNames
   }
      registrationBlock {
        ...wholeBlock
      }
      attestationsCreated
      attestationsRevoked
      attestationsRemoved
      validAttestations
      attestations(orderBy: ID_ASC) {
        totalCount
        nodes {
          ...wholeAttestation
        }
      }
    }
  }
}

fragment wholeBlock on Block{
  id,
  hash,
  timeStamp,
}

fragment DidNames on Did {
  id
  web3NameId
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
