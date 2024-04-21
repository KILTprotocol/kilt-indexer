export {
  handleAttestationCreated,
  handleAttestationRevoked,
  handleAttestationRemoved,
  handleAttestationDepositReclaimed,
} from "./attestations/attestationHandlers";

export { handleCTypeCreated } from "./cTypes/cTypeHandlers";

export { handleDidCreated, handleDidDeleted } from "./dids/didHandlers";

export {
  handleWeb3NameClaimed,
  handleWeb3NameReleased,
  handleWeb3NameBanned,
  handleWeb3NameUnbanned,
} from "./web3names/w3nHandlers";

export {
  handlePublicCredentialStored,
  handlePublicCredentialRemoved,
  handlePublicCredentialRevoked,
  handlePublicCredentialUnrevoked,
} from "./assetDIDs/publicCredentialHandlers";
