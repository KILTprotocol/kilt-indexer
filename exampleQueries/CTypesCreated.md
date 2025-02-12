## Find all cTypes created during the second million blocks:

```
query CTypesCreated {
  cTypes(
    filter: {
      registrationBlockId: {
        greaterThanOrEqualTo: "1000000"
        lessThanOrEqualTo: "2000000"
      }
    }
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
      validAttestations
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
```
