import type { SubstrateExtrinsic } from "@subql/types";
import type { Bytes, Vec } from "@polkadot/types";
import assert from "assert";
import { cTypeHasher } from "./cTypeHasher";
import type { CTypeHash, ICType } from "@kiltprotocol/types";
import type { GenericExtrinsic } from "@polkadot/types/extrinsic";

const relevantCalls = {
  submitDidCall: { pallet: "did", method: "submitDidCall" },
  dispatchAs: { pallet: "did", method: "dispatchAs" },
  batch: { pallet: "utility", method: "batch" },
  batchAll: { pallet: "utility", method: "batchAll" },
  forceBatch: { pallet: "utility", method: "forceBatch" },
  addCType: { pallet: "ctype", method: "add" },
  proxy: { pallet: "proxy", method: "proxy" },
};

/** Extracts the cType definition (schema) from the extrinsic, coming from the CTypeCreated event.
 *
 * In case that there are several cType creations in one extrinsic batch, it would hash the definitions and compare with `targetCTypeHash`.
 *
 * @param extrinsic
 * @param targetCTypeHash Hex-string from Event. Without "kilt:ctype:"
 */
export function extractCTypeDefinition(
  extrinsic: SubstrateExtrinsic | undefined,
  targetCTypeHash: CTypeHash
): string {
  assert(extrinsic, "Extrinsic not defined");

  const blockNumber = extrinsic.block.block.header.number.toString();

  const usedCall: GenericExtrinsic["method"] = extrinsic.extrinsic.method;

  logger.trace("The whole extrinsic: " + JSON.stringify(usedCall, null, 2));

  let definition: string | false;

  switch (usedCall.section) {
    case relevantCalls.submitDidCall.pallet:
      switch (usedCall.method) {
        case relevantCalls.submitDidCall.method:
          definition = manageSubmitDidCall(usedCall, targetCTypeHash);
          break;
        case relevantCalls.dispatchAs.method:
          definition = manageDispatchAsCalls(usedCall, targetCTypeHash);
          break;
        default:
          definition = false;
          break;
      }
      break;
    case relevantCalls.batchAll.pallet:
      definition = manageBatchCalls(usedCall, targetCTypeHash);
      break;
    case relevantCalls.proxy.pallet:
      definition = manageProxyCall(usedCall, targetCTypeHash);
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
  targetCTypeHash: CTypeHash
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

  if (childPallet === relevantCalls.addCType.pallet) {
    return manageAddCTypeCall(childCall, targetCTypeHash);
  }
  if (childPallet === relevantCalls.batchAll.pallet) {
    return manageBatchCalls(childCall, targetCTypeHash);
  }
  if (childMethod === relevantCalls.submitDidCall.method) {
    return manageSubmitDidCall(childCall, targetCTypeHash);
  }
  if (childMethod === relevantCalls.dispatchAs.method) {
    return manageDispatchAsCalls(childCall, targetCTypeHash);
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
  targetCTypeHash: CTypeHash
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

      if (childPallet === relevantCalls.addCType.pallet) {
        return manageAddCTypeCall(childCall, targetCTypeHash);
      }
      if (childMethod === relevantCalls.submitDidCall.method) {
        return manageSubmitDidCall(childCall, targetCTypeHash);
      }
      if (childMethod === relevantCalls.dispatchAs.method) {
        return manageDispatchAsCalls(childCall, targetCTypeHash);
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
  targetCTypeHash: CTypeHash
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

  // first call argument is a struct with a 'call' property
  const childCall = (call.args[0] as any).call as GenericExtrinsic["method"];
  const { section: childPallet, method: childMethod } = childCall;

  if (childPallet === relevantCalls.addCType.pallet) {
    return manageAddCTypeCall(childCall, targetCTypeHash);
  }
  if (childPallet === relevantCalls.batchAll.pallet) {
    return manageBatchCalls(childCall, targetCTypeHash);
  }
  if (childMethod === relevantCalls.proxy.method) {
    return manageProxyCall(childCall, targetCTypeHash);
  }

  if (childMethod === relevantCalls.submitDidCall.method) {
    return manageSubmitDidCall(childCall, targetCTypeHash);
  }
  if (childMethod === relevantCalls.dispatchAs.method) {
    return manageDispatchAsCalls(childCall, targetCTypeHash);
  }

  return false;
}

/** Process extrinsic call and extracts cType definition that matches `targetCTypeHash`.
 *
 * @param call Call of this type:
 *  Pallet: DID.
 *  Method: dispatch_as.
 * @param targetCTypeHash Hex-string from Event. Without "kilt:ctype:"
 *
 */
function manageDispatchAsCalls(
  call: GenericExtrinsic["method"],
  targetCTypeHash: CTypeHash
): string | false {
  const { section: parentPallet, method: parentMethod } = call;
  assert(
    parentPallet === relevantCalls.dispatchAs.pallet,
    "Erroneous extrinsic passed to this function. Wrong Pallet!"
  );
  assert(
    parentMethod === relevantCalls.dispatchAs.method,
    "Erroneous extrinsic passed to this function. Wrong Method!"
  );

  // second call argument is the inner call
  const childCall = call.args[1] as GenericExtrinsic["method"];
  const { section: childPallet, method: childMethod } = childCall;

  if (childPallet === relevantCalls.addCType.pallet) {
    return manageAddCTypeCall(childCall, targetCTypeHash);
  }
  if (childPallet === relevantCalls.batchAll.pallet) {
    return manageBatchCalls(childCall, targetCTypeHash);
  }
  if (childMethod === relevantCalls.proxy.method) {
    return manageProxyCall(childCall, targetCTypeHash);
  }

  if (childMethod === relevantCalls.submitDidCall.method) {
    return manageSubmitDidCall(childCall, targetCTypeHash);
  }
  if (childMethod === relevantCalls.dispatchAs.method) {
    return manageDispatchAsCalls(childCall, targetCTypeHash);
  }

  return false;
}

/** Process extrinsic call and extracts cType definition, if it matches `targetCTypeHash`.
 *
 * @param call Calls of this type:
 *  Pallet: cType.
 *  Method: add_ctype.
 * @param targetCTypeHash Hex-string from Event. Without "kilt:ctype:"
 *
 */
function manageAddCTypeCall(
  call: GenericExtrinsic["method"],
  targetCTypeHash: CTypeHash
): string | false {
  const { section: pallet, method } = call;
  assert(
    pallet === relevantCalls.addCType.pallet,
    "Erroneous extrinsic passed to this function. Wrong Pallet!"
  );
  assert(
    method === relevantCalls.addCType.method,
    "Erroneous extrinsic passed to this function. Wrong Method!"
  );
  // first call argument is the ctype definition, but without the id
  const cTypeDefinition = call.args[0] as Bytes;
  return validateDefinitionAgainstHash(
    cTypeDefinition.toUtf8(),
    targetCTypeHash
  );
}

/** Hashes the `cTypeDefinition` and compares it to the `targetCTypeHash`.
 *
 * If there is a match, it returns the `cTypeDefinition`, otherwise `false`.
 *
 * @param cTypeDefinition
 * @param targetCTypeHash Hex-string from Event. Without "kilt:ctype:"
 */
function validateDefinitionAgainstHash(
  cTypeDefinition: string,
  targetCTypeHash: CTypeHash
): string | false {
  logger.trace("The target CTypeHash from the event: " + targetCTypeHash);

  logger.trace("The definition being evaluated: " + cTypeDefinition);

  const cTypeSchema: ICType = JSON.parse(cTypeDefinition);
  const cTypeHash = cTypeHasher(cTypeSchema);

  logger.trace("The resulting cTypeHash is: " + cTypeHash);

  if (targetCTypeHash === cTypeHash) {
    return cTypeDefinition;
  }
  return false;
}
