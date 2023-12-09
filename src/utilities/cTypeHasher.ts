import type { CTypeHash, DidUri, ICType } from "@kiltprotocol/types";
import * as alphabetic from "jsonabc";

/**
 * Utility for (re)creating CType hashes.
 * Sorts the schema and strips the $id property (which contains the CType hash) before stringifying.
 *
 * Encodes the provided CType for use in `api.tx.ctype.add()`.
 *
 * @param cType The CType (with or without $id).
 * @returns A deterministic JSON serialization of a CType, omitting the $id property.
 */
export function serializeForHash(cTypeSchema: ICType) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { $id, ...schemaWithoutId } = cTypeSchema;
  return encodeObjectAsStr(schemaWithoutId);
}

/**
 * Stringifies numbers, booleans, and objects. Object keys are sorted to yield consistent hashing.
 *
 * @param value Object or value to be hashed.
 * @returns Stringified representation of the given object.
 */
function encodeObjectAsStr(
  value: Record<string, any> | string | number | boolean
): string {
  const input =
    // eslint-disable-next-line no-nested-ternary
    typeof value === "object" && value !== null
      ? JSON.stringify(alphabetic.sortObj(value))
      : // eslint-disable-next-line no-nested-ternary
      typeof value === "number" && value !== null
      ? value.toString()
      : typeof value === "boolean" && value !== null
      ? JSON.stringify(value)
      : value;
  return input.normalize("NFC");
}
