import type { CTypeHash, ICType } from "@kiltprotocol/types";
import { blake2AsHex } from "@polkadot/util-crypto";
import * as alphabetic from "jsonabc";

/**
 * Calculates the CType hash from a schema.
 *
 * @param cType The ICType with $id.
 * @returns Hash as hex string.
 */
export function cTypeHasher(cTypeSchema: ICType): CTypeHash {
  const { $id, ...schemaWithoutId } = cTypeSchema;
  const stringified = JSON.stringify(alphabetic.sortObj(schemaWithoutId));
  const hash = blake2AsHex(stringified.normalize("NFC"));

  return hash;
}
