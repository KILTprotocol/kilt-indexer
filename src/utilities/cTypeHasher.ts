import type { CTypeHash, DidUri, HexString, ICType } from "@kiltprotocol/types";
import { u8aToHex } from "@polkadot/util";
import { blake2AsU8a } from "@polkadot/util-crypto";
import * as alphabetic from "jsonabc";

// Copy some functions from the KILT-SDK
/**
 * Types accepted by hashing and crypto functions.
 */
export declare type CryptoInput = Buffer | Uint8Array | string;

export declare type BitLength = 64 | 128 | 256 | 384 | 512;

/**
 * Calculates the CType hash from a schema.
 *
 * @param cType The ICType with $id.
 * @returns Hash as hex string.
 */
export function getHashForSchema(cType: ICType): CTypeHash {
  const serializedSchema = serializeForHash(cType);
  return hashStr(serializedSchema);
}

/**
 * Create the blake2b and return the result as a hex string.
 *
 * @param value Value to be hashed.
 * @returns Blake2b hash as hex string.
 */
export function hashStr(value: CryptoInput): HexString {
  return u8aToHex(hash(value));
}

/**
 * Create the blake2b and return the result as an u8a with the specified `bitLength`.
 *
 * @param value Value to be hashed.
 * @param bitLength Bit length of hash.
 * @returns Blake2b hash byte array.
 */
function hash(value: CryptoInput, bitLength?: BitLength): Uint8Array {
  return blake2AsU8a(value, bitLength);
}

/**
 * Utility for (re)creating CType hashes.
 * Sorts the schema and strips the $id property (which contains the CType hash) before stringifying.
 *
 * Encodes the provided CType for use in `api.tx.ctype.add()`.
 *
 * @param cTypeSchema The CType with $id.
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
