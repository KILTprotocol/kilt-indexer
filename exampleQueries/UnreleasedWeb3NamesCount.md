## Get count of Web3Name's Ownerships that have not being released yet:

```
query UnreleasedWeb3NamesCount {
  ownerships(
    orderBy: CLAIM_BLOCK_ID_DESC
    filter: { releaseBlockExists: false }
  ) {
    totalCount
    aggregates {
      distinctCount {
        id
        nameId
        bearerId
        claimBlockId
        releaseBlockId
      }
    }
  }
}

```

`id`s are the **Ownership.id**, like _#3_w3n:john_.
`nameId`s are the **Web3Name.id**, like _w3n:john_.

If the distinct count of `id`s and `nameId`s do not match, it would mean that the database has two owners for the same web3name.
Like _#5_w3n:john_ and _#7_w3n:john_ still being the claimers of the _w3n:john_ name.
