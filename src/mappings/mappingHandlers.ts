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

export { handleDidCreated } from "./dids/didHandlers";
