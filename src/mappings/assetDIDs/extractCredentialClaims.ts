import type { SubstrateExtrinsic } from "@subql/types";
import type { Bytes, Vec } from "@polkadot/types";
import assert from "assert";
import type { HexString, ICType } from "@kiltprotocol/types";
import type { GenericExtrinsic } from "@polkadot/types/extrinsic";
import { cTypeHasher } from "../cTypes/cTypeHasher";
import cbor from "cbor-web";

const relevantCalls = {
  submitDidCall: { pallet: "did", method: "submitDidCall" },
  batch: { pallet: "utility", method: "batch" },
  batchAll: { pallet: "utility", method: "batchAll" },
  forceBatch: { pallet: "utility", method: "forceBatch" },
  addCredential: { pallet: "publicCredentials", method: "add" },
  proxy: { pallet: "proxy", method: "proxy" },
};

/** Extracts the claims content on the public credential from the extrinsic, coming from the PublicCredentialStored event.
 *
 * In case that there are several public credentials in one extrinsic batch, it would hash the claims and compare with `targetCredentialHash`.
 *
 * @param extrinsic
 * @param targetCredentialHash Hex-string from Event.
 */
export function extractCredentialClaims(
  extrinsic: SubstrateExtrinsic | undefined,
  targetCredentialHash: HexString
): string {
  assert(extrinsic, "Extrinsic not defined");

  const blockNumber = extrinsic.block.block.header.number.toString();

  const usedCall: GenericExtrinsic["method"] = extrinsic.extrinsic.method;

  logger.info("The whole extrinsic: " + JSON.stringify(usedCall, null, 2));

  let definition: string | false;

  switch (usedCall.section) {
    case relevantCalls.submitDidCall.pallet:
      definition = manageSubmitDidCall(usedCall, targetCredentialHash);
      break;
    case relevantCalls.batchAll.pallet:
      definition = manageBatchCalls(usedCall, targetCredentialHash);
      break;
    case relevantCalls.proxy.pallet:
      definition = manageProxyCall(usedCall, targetCredentialHash);
      break;
    default:
      definition = false;
      break;
  }

  assert(
    definition,
    `Could not extract ctype definition from extrinsic in block #${blockNumber}`
  );

  // Print the definition
  logger.info(`cType definition: ${definition}`);

  return definition;
}

// Use "manage" instead of "handle" to differentiate from the handlers on `mappingHandlers.ts`.

/** Process extrinsic call and extracts cType definition that matches `targetCTypeHash`.
 *
 * @param call Call of this type:
 *  Pallet: Proxy.
 *  Method: proxy.
 * @param targetCTypeHash Hex-string from Event. Without "kilt:ctype:"
 *
 */
function manageProxyCall(
  call: GenericExtrinsic["method"],
  targetCTypeHash: HexString
): string | false {
  const { section: parentPallet, method: parentMethod } = call;
  assert(
    parentPallet === relevantCalls.proxy.pallet,
    "Erroneous extrinsic passed to this function. Wrong Pallet!"
  );
  assert(
    parentMethod === relevantCalls.proxy.method,
    "Erroneous extrinsic passed to this function. Wrong Method!"
  );

  // third call argument is proxied call
  const childCall = call.args[2] as GenericExtrinsic["method"];
  const { section: childPallet, method: childMethod } = childCall;

  if (childPallet === relevantCalls.addCredential.pallet) {
    return manageAddPublicCredential(childCall, targetCTypeHash);
  }
  if (childPallet === relevantCalls.batchAll.pallet) {
    return manageBatchCalls(childCall, targetCTypeHash);
  }
  if (childMethod === relevantCalls.submitDidCall.method) {
    return manageSubmitDidCall(childCall, targetCTypeHash);
  }

  if (childMethod === relevantCalls.proxy.method) {
    // Is this possible?
    return manageProxyCall(childCall, targetCTypeHash);
  }

  return false;
}

/** Process extrinsic call and extracts cType definition that matches `targetCTypeHash`.
 *
 * @param call Calls of this type:
 *  Pallet: Utility.
 *  Method: batch | batch_all | force_batch.
 * @param targetCTypeHash Hex-string from Event. Without "kilt:ctype:"
 *
 */
function manageBatchCalls(
  call: GenericExtrinsic["method"],
  targetCTypeHash: HexString
): string | false {
  const { section: parentPallet } = call;
  assert(
    parentPallet === relevantCalls.batchAll.pallet,
    "Erroneous extrinsic passed to this function. Wrong Pallet!"
  );

  // first call argument is a vector of calls:
  const childrenCalls = call.args[0] as Vec<GenericExtrinsic["method"]>;

  const matchedDefinitions = childrenCalls
    .map((childCall) => {
      const { section: childPallet, method: childMethod } = childCall;

      if (childPallet === relevantCalls.addCredential.pallet) {
        return manageAddPublicCredential(childCall, targetCTypeHash);
      }
      if (childPallet === relevantCalls.submitDidCall.pallet) {
        return manageSubmitDidCall(childCall, targetCTypeHash);
      }
      if (childPallet === relevantCalls.batchAll.pallet) {
        return manageBatchCalls(childCall, targetCTypeHash);
      }
      if (childMethod === relevantCalls.proxy.method) {
        return manageProxyCall(childCall, targetCTypeHash);
      }
      return false;
    })
    .filter((element): element is string => !!element);

  assert(
    matchedDefinitions.length <= 1,
    "More than one add-ctype extrinsic in this utility batch has a cType-definition that matches cType-id from event."
  );

  return matchedDefinitions[0] ?? false;
}
/** Process extrinsic call and extracts cType definition that matches `targetCTypeHash`.
 *
 * @param call Call of this type:
 *  Pallet: DID.
 *  Method: submit_did_call.
 * @param targetCTypeHash Hex-string from Event. Without "kilt:ctype:"
 *
 */
function manageSubmitDidCall(
  call: GenericExtrinsic["method"],
  targetCTypeHash: HexString
): string | false {
  const { section: parentPallet, method: parentMethod } = call;
  assert(
    parentPallet === relevantCalls.submitDidCall.pallet,
    "Erroneous extrinsic passed to this function. Wrong Pallet!"
  );
  assert(
    parentMethod === relevantCalls.submitDidCall.method,
    "Erroneous extrinsic passed to this function. Wrong Method!"
  );

  // debugger:
  logger.info(" Im here on the manageSubmitDidCall");

  // first call argument is a struct with a 'call' property
  const childCall = (call.args[0] as any).call as GenericExtrinsic["method"];
  const { section: childPallet, method: childMethod } = childCall;

  logger.info(
    "the childPallet: " + childPallet + "; childMethod: " + childMethod
  );

  if (childPallet === relevantCalls.addCredential.pallet) {
    return manageAddPublicCredential(childCall, targetCTypeHash);
  }
  if (childPallet === relevantCalls.batchAll.pallet) {
    return manageBatchCalls(childCall, targetCTypeHash);
  }
  if (childMethod === relevantCalls.proxy.method) {
    return manageProxyCall(childCall, targetCTypeHash);
  }

  if (childMethod === relevantCalls.submitDidCall.method) {
    // Is this possible?
    return manageSubmitDidCall(childCall, targetCTypeHash);
  }

  // debugger:
  logger.info(" Im leaving the manageSubmitDidCall");

  return false;
}

interface CredentialOnChain {
  ctypeHash: HexString;
  subject: HexString;
  claims: HexString;
  authorization: string | null;
}

/** Process extrinsic call and extracts cType definition, if it matches `targetCTypeHash`.
 *
 * @param call Calls of this type:
 *  Pallet: publicCredentials.
 *  Method: add.
 * @param targetCredentialHash Hex-string from Event.
 *
 */
function manageAddPublicCredential(
  call: GenericExtrinsic["method"],
  targetCredentialHash: HexString
): string | false {
  const { section: pallet, method } = call;
  assert(
    pallet === relevantCalls.addCredential.pallet,
    "Erroneous extrinsic passed to this function. Wrong Pallet!"
  );
  assert(
    method === relevantCalls.addCredential.method,
    "Erroneous extrinsic passed to this function. Wrong Method!"
  );
  // the only call argument is the credential object
  const credential = call.args[0] as unknown as CredentialOnChain;

  // debugger
  logger.info("type of credential: " + typeof credential);

  logger.info("credential: " + JSON.stringify(credential, null, 2));

  return validateClaimsAgainstHash(credential.claims, targetCredentialHash);
}

/** Hashes the `encodedClaims` and compares it to the `targetCredentialHash`.
 *
 * If there is a match, it returns the decoded claims, otherwise `false`.
 *
 * @param encodedClaims
 * @param targetCredentialHash Hex-string from Event.
 */
function validateClaimsAgainstHash(
  encodedClaims: HexString,
  targetCredentialHash: HexString
): string | false {
  logger.info(
    "The target CredentialHash from the event: " + targetCredentialHash
  );

  logger.info("The encoded claims being evaluated: " + encodedClaims);

  const claims = cbor.decode(encodedClaims);

  // const claims = cbor.decode(encodedClaims.split("x")[1]);

  logger.info("The decoded claims being evaluated: " + claims);

  const cTypeSchema: ICType = JSON.parse(encodedClaims);
  const cTypeHash = cTypeHasher(cTypeSchema);

  logger.trace("The resulting cTypeHash is: " + cTypeHash);

  if (targetCredentialHash === cTypeHash) {
    return encodedClaims;
  }
  return false;
}
