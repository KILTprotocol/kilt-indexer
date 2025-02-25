## Find how many attestations were made on a block:

```
query AttestationsInBlock {
  blocks(filter: { id: { equalTo: "3396407" } }) {
    # Queries can have comments!
    nodes {
      id
      timeStamp
      hash
      attestationsByCreationBlockId {
        totalCount
        nodes {
          id
          cTypeId
          claimHash
          issuerId
        }
      }
    }
  }
}
```
