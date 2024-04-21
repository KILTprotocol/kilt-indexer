## Get current total counts for key entities and most relevant indicators:

```
query CurrentTotalCounts {
  DIDsCreated: dids {
    totalCount
  }
  DIDsDeleted: dids(filter: { deletionBlockExists: true }) {
    totalCount
  }
  ActiveDIDs: dids(filter: { active: { equalTo: true } }) {
    totalCount
  }
  Web3NamesEverClaimed: web3Names {
    totalCount
  }
  CurrentlyOwnedW3Ns: web3Names(filter: { didsByWeb3NameIdExist: true }) {
    totalCount
  }
  CTypesCreated: cTypes {
    totalCount
  }
  UsedCTypes: cTypes(
    filter: {
      or: [{ attestationsExist: true }, { publicCredentialsExist: true }]
    }
  ) {
    totalCount
  }
  AttestationsCreated: attestations {
    totalCount
  }
  CurrentlyValidAttestations: attestations(
    filter: { valid: { equalTo: true } }
  ) {
    totalCount
  }
  RegisteredAssetDIDs: assetDIDs {
    totalCount
  }
  PublicCredentialsCreated: publicCredentials {
    totalCount
  }
  CurrentlyValidPublicCredentials: publicCredentials(
    filter: { valid: { equalTo: true } }
  ) {
    totalCount
  }
}
```
