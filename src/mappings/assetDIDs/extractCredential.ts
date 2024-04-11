import type { AssetDidUri, DidUri, HexString } from "@kiltprotocol/types";
import { PublicCredentialsCredentialsCredential } from "@kiltprotocol/augment-api";
import type { Vec } from "@polkadot/types";
import { Codec } from "@polkadot/types-codec/types";
import type { GenericExtrinsic } from "@polkadot/types/extrinsic";
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
  dispatchAs: { pallet: "did", method: "dispatchAs" },
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
export function extractCredential(
  extrinsic: SubstrateExtrinsic | undefined,
  targetCredentialHash: HexString
): CredentialFromChain {
  assert(extrinsic, "Extrinsic not defined");

  const blockNumber = extrinsic.block.block.header.number.toString();

  const usedCall: GenericExtrinsic["method"] = extrinsic.extrinsic.method;

  logger.trace("The whole extrinsic: " + JSON.stringify(usedCall, null, 2));

  let credential: CredentialFromChain | false;

  switch (usedCall.section) {
    case relevantCalls.submitDidCall.pallet:
      switch (usedCall.method) {
        case relevantCalls.submitDidCall.method:
          credential = manageSubmitDidCall(usedCall, targetCredentialHash);
          break;
        case relevantCalls.dispatchAs.method:
          credential = manageDispatchAsCalls(usedCall, targetCredentialHash);
          break;
        default:
          credential = false;
          break;
      }
      break;
    case relevantCalls.batchAll.pallet:
      credential = manageBatchCalls(usedCall, targetCredentialHash);
      break;
    case relevantCalls.proxy.pallet:
      credential = manageProxyCall(usedCall, targetCredentialHash);
      break;

    default:
      credential = false;
      break;
  }

  assert(
    credential,
    `Could not extract credential from extrinsic in block #${blockNumber}`
  );

  logger.info(
    `public credential extracted from chain: ${JSON.stringify(
      credential,
      null,
      2
    )}`
  );

  return credential;
}

// Use "manage" instead of "handle" to differentiate from the handlers on `mappingHandlers.ts`.

/** Process extrinsic call and extracts credential that matches `targetCredentialHash`.
 *
 * @param call Call of this type:
 *  Pallet: Proxy.
 *  Method: proxy.
 * @param targetCredentialHash Hex-string from Event.
 *
 */
function manageProxyCall(
  call: GenericExtrinsic["method"],
  targetCredentialHash: HexString,
  attesterDidAccount?: Codec
): CredentialFromChain | false {
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
    assert(
      attesterDidAccount,
      "Attester DID missing. Can not very credential without it."
    );
    return manageAddPublicCredential(
      childCall,
      targetCredentialHash,
      attesterDidAccount
    );
  }
  if (childPallet === relevantCalls.batchAll.pallet) {
    return manageBatchCalls(
      childCall,
      targetCredentialHash,
      attesterDidAccount
    );
  }
  if (childMethod === relevantCalls.submitDidCall.method) {
    return manageSubmitDidCall(
      childCall,
      targetCredentialHash,
      attesterDidAccount
    );
  }
  if (childMethod === relevantCalls.dispatchAs.method) {
    return manageDispatchAsCalls(
      childCall,
      targetCredentialHash,
      attesterDidAccount
    );
  }

  if (childMethod === relevantCalls.proxy.method) {
    // Is this possible?
    return manageProxyCall(childCall, targetCredentialHash, attesterDidAccount);
  }

  return false;
}

/** Process extrinsic call and extracts credential that matches `targetCredentialHash`.
 *
 * @param call Calls of this type:
 *  Pallet: Utility.
 *  Method: batch | batch_all | force_batch.
 * @param targetCredentialHash Hex-string from Event.
 *
 */
function manageBatchCalls(
  call: GenericExtrinsic["method"],
  targetCredentialHash: HexString,
  attesterDidAccount?: Codec
): false | CredentialFromChain {
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
        assert(
          attesterDidAccount,
          "Attester DID missing. Can not very credential without it."
        );
        return manageAddPublicCredential(
          childCall,
          targetCredentialHash,
          attesterDidAccount
        );
      }
      if (childPallet === relevantCalls.submitDidCall.method) {
        return manageSubmitDidCall(
          childCall,
          targetCredentialHash,
          attesterDidAccount
        );
      }
      if (childMethod === relevantCalls.dispatchAs.method) {
        return manageDispatchAsCalls(
          childCall,
          targetCredentialHash,
          attesterDidAccount
        );
      }
      if (childPallet === relevantCalls.batchAll.pallet) {
        return manageBatchCalls(
          childCall,
          targetCredentialHash,
          attesterDidAccount
        );
      }
      if (childMethod === relevantCalls.proxy.method) {
        return manageProxyCall(
          childCall,
          targetCredentialHash,
          attesterDidAccount
        );
      }
      return false;
    })
    .filter((element): element is CredentialFromChain => !!element);
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
 * @param targetCredentialHash Hex-string from Event.
 *
 */
function manageSubmitDidCall(
  call: GenericExtrinsic["method"],
  targetCredentialHash: HexString,
  attesterDidAccount?: Codec
): CredentialFromChain | false {
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

  if (attesterDidAccount) {
    assert(
      attesterDidAccount === didAccountId,
      `Found nested Submit-DID-Calls with different DIDs. Who is the real attester? \n Outer-DID: ${attesterDidAccount}. \n Inner-DID: ${didAccountId}.`
    );
  }

  if (childPallet === relevantCalls.addCredential.pallet) {
    return manageAddPublicCredential(
      childCall,
      targetCredentialHash,
      didAccountId
    );
  }
  if (childPallet === relevantCalls.batchAll.pallet) {
    return manageBatchCalls(
      childCall,
      targetCredentialHash,
      attesterDidAccount
    );
  }
  if (childMethod === relevantCalls.proxy.method) {
    return manageProxyCall(childCall, targetCredentialHash, attesterDidAccount);
  }

  if (childMethod === relevantCalls.submitDidCall.method) {
    return manageSubmitDidCall(
      childCall,
      targetCredentialHash,
      attesterDidAccount
    );
  }
  if (childMethod === relevantCalls.dispatchAs.method) {
    return manageDispatchAsCalls(
      childCall,
      targetCredentialHash,
      attesterDidAccount
    );
  }

  return false;
}

/** Process extrinsic call and extracts credential that matches `targetCredentialHash`.
 *
 * @param call Call of this type:
 *  Pallet: DID.
 *  Method: dispatch_as.
 * @param targetCredentialHash Hex-string from Event.
 *
 */
function manageDispatchAsCalls(
  call: GenericExtrinsic["method"],
  targetCredentialHash: HexString,
  attesterDidAccount?: Codec
): CredentialFromChain | false {
  const { section: parentPallet, method: parentMethod } = call;

  assert(
    parentPallet === relevantCalls.dispatchAs.pallet,
    "Erroneous extrinsic passed to this function. Wrong Pallet!"
  );
  assert(
    parentMethod === relevantCalls.dispatchAs.method,
    "Erroneous extrinsic passed to this function. Wrong Method!"
  );

  // first call argument is the didIdentifier (origin)
  const didAccountId = call.args[0] as Codec;

  // second call argument is the inner call
  const childCall = call.args[1] as GenericExtrinsic["method"];
  const { section: childPallet, method: childMethod } = childCall;

  if (attesterDidAccount) {
    assert(
      attesterDidAccount === didAccountId,
      `Found nested Submit-DID-Calls with different DIDs. Who is the real attester? \n Outer-DID: ${attesterDidAccount}. \n Inner-DID: ${didAccountId}.`
    );
  }

  if (childPallet === relevantCalls.addCredential.pallet) {
    return manageAddPublicCredential(
      childCall,
      targetCredentialHash,
      didAccountId
    );
  }
  if (childPallet === relevantCalls.batchAll.pallet) {
    return manageBatchCalls(
      childCall,
      targetCredentialHash,
      attesterDidAccount
    );
  }
  if (childMethod === relevantCalls.proxy.method) {
    return manageProxyCall(childCall, targetCredentialHash, attesterDidAccount);
  }

  if (childMethod === relevantCalls.submitDidCall.method) {
    return manageSubmitDidCall(
      childCall,
      targetCredentialHash,
      attesterDidAccount
    );
  }
  if (childMethod === relevantCalls.dispatchAs.method) {
    return manageDispatchAsCalls(
      childCall,
      targetCredentialHash,
      attesterDidAccount
    );
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
function manageAddPublicCredential(
  call: GenericExtrinsic["method"],
  targetCredentialHash: HexString,
  attesterDidAccount: Codec
): CredentialFromChain | false {
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
  const credential = call.args[0] as PublicCredentialsCredentialsCredential;

  return validateCredentialAgainstHash(
    credential,
    attesterDidAccount,
    targetCredentialHash
  );
}

/** Hashes the `credential` and compares it to the `targetCredentialHash`.
 *
 * If there is a match, it returns the decoded claims, otherwise `false`.
 *
 * @param credential
 * @param targetCredentialHash Hex-string from Event.
 */
function validateCredentialAgainstHash(
  credential: PublicCredentialsCredentialsCredential,
  attesterDidAccount: Codec,
  targetCredentialHash: HexString
): CredentialFromChain | false {
  logger.trace(
    "The target CredentialHash from the event: " + targetCredentialHash
  );

  const encodedCredential = credential.toU8a();
  const encodedAttester = attesterDidAccount.toU8a();
  const hashedCredential = blake2AsHex(
    Uint8Array.from([...encodedCredential, ...encodedAttester])
  );

  logger.trace("The resulting Credential ID is: " + hashedCredential);

  const attesterDid = ("did:kilt:" + attesterDidAccount) as DidUri;

  const readableCredential: CredentialFromChain = {
    ctypeHash: credential.ctypeHash.toHex(),
    subject: credential.subject.toUtf8() as AssetDidUri,
    claims: credential.claims.toHex(),
    authorization: credential.authorization.unwrapOr(null)?.toHex() ?? null,
    attesterDid,
  };

  if (targetCredentialHash === hashedCredential) {
    return readableCredential;
  }
  return false;
}
