## Find out who has ever owned w3n:john_doe and when:

```
query WhoIsJohnDoe {
  web3Names(filter: { id: { equalTo: "w3n:john_doe" } }) {
    nodes {
      id
      banned
      ownerships(orderBy: ID_ASC) {
        totalCount
        nodes {
          id
          bearerId
          payer
          claimBlockId
          releaseBlockId
        }
      }
    }
  }
}
```
