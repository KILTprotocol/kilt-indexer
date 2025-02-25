## Get all Public Credentials and its corresponding Updates:

```
   query PublicCredentialsAndUpdates {
      publicCredentials {
        totalCount
        nodes {
          id
          subjectId
          claims
          cTypeId
          issuerId
          payer
          valid
          updates(orderBy: ID_ASC) {
            totalCount
            nodes {
              id
              nature
              updateBlockId
            }
          }
        }
      }
    }
```
