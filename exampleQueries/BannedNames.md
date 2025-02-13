## Find registered data about banned web3names:

```
query BannedNames {
  web3Names(filter: { banned: { equalTo: true } }) {
    totalCount
    nodes {
      id
      banned
      ownerships {
        totalCount
        nodes {
          id
          bearerId
          claimBlockId
          releaseBlockId
        }
      }

      sanctionsByNameId {
        totalCount
        nodes {
          id
          nameId
          nature
          enforcementBlockId
        }
      }
    }
  }
}
```

It has never happened on the KILT production blockchain _Spiritnet_.
