// TODO: Remove the UNKNOWN constant before deployment.

/** Solves problems while trying to start Data Base from higher block. */
export const UNKNOWN = "UNKNOWN_BECAUSE_IT_IS_PREHISTORIC";

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
} from "./assetDIDs/publicCredentialHandlers";
