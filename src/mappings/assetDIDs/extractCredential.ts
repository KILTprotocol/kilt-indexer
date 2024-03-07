import type { AssetDidUri, DidUri, HexString } from "@kiltprotocol/types";
import type { Vec } from "@polkadot/types";
import { Codec } from "@polkadot/types-codec/types";
import type { GenericExtrinsic } from "@polkadot/types/extrinsic";
import { u8aConcat } from "@polkadot/util";
import { blake2AsHex } from "@polkadot/util-crypto";
import type { SubstrateExtrinsic } from "@subql/types";
import assert from "assert";

interface CredentialOnChain {
  ctypeHash: HexString;
  subject: AssetDidUri; // assetDID-URI
  claims: HexString; // CBOR serialized claims
  authorization: string | null;
}

export interface CredentialFromChain extends CredentialOnChain {
  attesterDid: DidUri;
}

const relevantCalls = {
  submitDidCall: { pallet: "did", method: "submitDidCall" },
  batch: { pallet: "utility", method: "batch" },
  batchAll: { pallet: "utility", method: "batchAll" },
  forceBatch: { pallet: "utility", method: "forceBatch" },
  addCredential: { pallet: "publicCredentials", method: "add" },
  proxy: { pallet: "proxy", method: "proxy" },
};

/** Extracts the content on the public credential from the extrinsic, coming from the PublicCredentialStored event.
 *
 * In case that there are several public credentials in one extrinsic batch, it would hash the claims and compare with `targetCredentialHash`.
 *
 * @param extrinsic
 * @param targetCredentialHash Hex-string from Event.
 */
export async function extractCredential(
  extrinsic: SubstrateExtrinsic | undefined,
  targetCredentialHash: HexString
): Promise<CredentialFromChain> {
  assert(extrinsic, "Extrinsic not defined");

  const blockNumber = extrinsic.block.block.header.number.toString();

  const usedCall: GenericExtrinsic["method"] = extrinsic.extrinsic.method;

  logger.info("The whole extrinsic: " + JSON.stringify(usedCall, null, 2));

  let definition: CredentialFromChain | false;

  switch (usedCall.section) {
    case relevantCalls.submitDidCall.pallet:
      definition = await manageSubmitDidCall(usedCall, targetCredentialHash);
      break;
    case relevantCalls.batchAll.pallet:
      definition = await manageBatchCalls(usedCall, targetCredentialHash);
      break;
    case relevantCalls.proxy.pallet:
      definition = await manageProxyCall(usedCall, targetCredentialHash);
      break;
    default:
      definition = false;
      break;
  }

  assert(
    definition,
    `Could not extract credential from extrinsic in block #${blockNumber}`
  );

  // Print the definition
  logger.info(`credential on chain: ${JSON.stringify(definition, null, 2)}`);

  return definition;
}

// Use "manage" instead of "handle" to differentiate from the handlers on `mappingHandlers.ts`.

/** Process extrinsic call and extracts credential that matches `targetCredentialHash`.
 *
 * @param call Call of this type:
 *  Pallet: Proxy.
 *  Method: proxy.
 * @param targetCTypeHash Hex-string from Event.
 *
 */
async function manageProxyCall(
  call: GenericExtrinsic["method"],
  targetCTypeHash: HexString
): Promise<CredentialFromChain | false> {
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

  // Not really Possible:
  // if (childPallet === relevantCalls.addCredential.pallet) {
  //   return await manageAddPublicCredential(childCall, targetCTypeHash);
  // }
  if (childPallet === relevantCalls.batchAll.pallet) {
    return await manageBatchCalls(childCall, targetCTypeHash);
  }
  if (childMethod === relevantCalls.submitDidCall.method) {
    return await manageSubmitDidCall(childCall, targetCTypeHash);
  }

  if (childMethod === relevantCalls.proxy.method) {
    // Is this possible?
    return await manageProxyCall(childCall, targetCTypeHash);
  }

  return false;
}

/** Process extrinsic call and extracts credential that matches `targetCredentialHash`.
 *
 * @param call Calls of this type:
 *  Pallet: Utility.
 *  Method: batch | batch_all | force_batch.
 * @param targetCTypeHash Hex-string from Event.
 *
 */
async function manageBatchCalls(
  call: GenericExtrinsic["method"],
  targetCTypeHash: HexString
): Promise<false | CredentialFromChain> {
  const { section: parentPallet } = call;
  assert(
    parentPallet === relevantCalls.batchAll.pallet,
    "Erroneous extrinsic passed to this function. Wrong Pallet!"
  );

  // first call argument is a vector of calls:
  const childrenCalls = call.args[0] as Vec<GenericExtrinsic["method"]>;

  const matchedDefinitions = await Promise.all(
    childrenCalls
      .map(async (childCall) => {
        const { section: childPallet, method: childMethod } = childCall;

        // Not really possible:
        // if (childPallet === relevantCalls.addCredential.pallet) {
        //   return manageAddPublicCredential(childCall, targetCTypeHash);
        // }
        if (childPallet === relevantCalls.submitDidCall.pallet) {
          return await manageSubmitDidCall(childCall, targetCTypeHash);
        }
        if (childPallet === relevantCalls.batchAll.pallet) {
          return await manageBatchCalls(childCall, targetCTypeHash);
        }
        if (childMethod === relevantCalls.proxy.method) {
          return await manageProxyCall(childCall, targetCTypeHash);
        }
        return false;
      })
      .filter((element): element is Promise<CredentialFromChain> => !!element)
  );

  assert(
    matchedDefinitions.length <= 1,
    "More than one add-PublicCredential extrinsic in this utility batch has a credential who's hash that matches credential-id from event."
  );

  return matchedDefinitions[0] ?? false;
}
/** Process extrinsic call and extracts credential that matches `targetCredentialHash`.
 *
 * @param call Call of this type:
 *  Pallet: DID.
 *  Method: submit_did_call.
 * @param targetCTypeHash Hex-string from Event.
 *
 */
async function manageSubmitDidCall(
  call: GenericExtrinsic["method"],
  targetCTypeHash: HexString
): Promise<CredentialFromChain | false> {
  const { section: parentPallet, method: parentMethod } = call;
  assert(
    parentPallet === relevantCalls.submitDidCall.pallet,
    "Erroneous extrinsic passed to this function. Wrong Pallet!"
  );
  assert(
    parentMethod === relevantCalls.submitDidCall.method,
    "Erroneous extrinsic passed to this function. Wrong Method!"
  );

  // first call argument is a struct with a 'call' and a 'did' property
  const childCall = (call.args[0] as any).call as GenericExtrinsic["method"];
  const didAccountId = (call.args[0] as any).did as Codec;
  const { section: childPallet, method: childMethod } = childCall;

  // const attesterDid = ("did:kilt:" + didAccountId) as DidUri;

  if (childPallet === relevantCalls.addCredential.pallet) {
    return await manageAddPublicCredential(
      childCall,
      targetCTypeHash,
      didAccountId
    );
  }
  if (childPallet === relevantCalls.batchAll.pallet) {
    return await manageBatchCalls(childCall, targetCTypeHash);
  }
  if (childMethod === relevantCalls.proxy.method) {
    return await manageProxyCall(childCall, targetCTypeHash);
  }

  if (childMethod === relevantCalls.submitDidCall.method) {
    // Is this possible?
    return await manageSubmitDidCall(childCall, targetCTypeHash);
  }

  return false;
}

/** Process extrinsic call and extracts credential that matches `targetCredentialHash`.
 *
 * @param call Calls of this type:
 *  Pallet: publicCredentials.
 *  Method: add.
 * @param targetCredentialHash Hex-string from Event.
 *
 */
async function manageAddPublicCredential(
  call: GenericExtrinsic["method"],
  targetCredentialHash: HexString,
  attesterDidAccount: Codec
): Promise<CredentialFromChain | false> {
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
  const credential = call.args[0];

  return validateClaimsAgainstHash(
    credential,
    attesterDidAccount,
    targetCredentialHash
  );
}

/** Hashes the `encodedClaims` and compares it to the `targetCredentialHash`.
 *
 * If there is a match, it returns the decoded claims, otherwise `false`.
 *
 * @param encodedClaims
 * @param targetCredentialHash Hex-string from Event.
 */
async function validateClaimsAgainstHash(
  credential: Codec,
  attesterDidAccount: Codec,
  targetCredentialHash: HexString
): Promise<CredentialFromChain | false> {
  logger.info(
    "The target CredentialHash from the event: " + targetCredentialHash
  );

  const encodedCredential = credential.toU8a();
  const encodedAttester = attesterDidAccount.toU8a();
  const hashedCredential = blake2AsHex(
    u8aConcat(encodedCredential, encodedAttester)
  );

  logger.info("encodedCredential length: " + encodedCredential.byteLength);
  logger.info("encodedAttester length: " + encodedAttester.byteLength);

  logger.info("The resulting Credential ID is: " + hashedCredential);

  const attesterDid = ("did:kilt:" + attesterDidAccount) as DidUri;

  const credentialHumanized =
    credential.toHuman() as unknown as CredentialOnChain;

  if (targetCredentialHash === hashedCredential) {
    return { ...credentialHumanized, attesterDid };
  }
  return false;
}

// How the Kilt-Node does it:
// // Credential ID = H(<scale_encoded_credential_input> ||
// // <scale_encoded_attester_identifier>)
// let credential_id =
// 	T::CredentialHash::hash(&[&credential.encode()[..], &attester.encode()[..]].concat()[..
