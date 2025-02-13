## Find DID bearer of w3n:alice and since when:

```
query WhoIsAlice {
  dids(filter: { web3NameId: { equalTo: "w3n:alice" } }) {
    nodes {
      id
      payer
      creationBlock {
        id
        timeStamp
      }
      deletionBlockId
      web3NameId
      ownershipsByBearerId {
        nodes {
          id
          claimBlock {
            id
            timeStamp
          }
          releaseBlockId
        }
      }
    }
  }
}

```
