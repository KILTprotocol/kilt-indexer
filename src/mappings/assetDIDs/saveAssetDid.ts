import type { Codec } from "@polkadot/types-codec/types";
import { Asset, AssetDID, Chain } from "../../types";
import {
  AssetDidUri,
  KiltPublishedCredentialCollectionV1Type,
} from "@kiltprotocol/types";

import { KiltAssetDidsV1AssetDid } from "@kiltprotocol/augment-api";

interface ISubjectId {
  chainId: {
    [key: string]: string;
  };
  assetId: {
    [key: string]: string[];
  };
}
interface IChain {
  namespace: string;
  reference: string;
}

interface IAsset {
  namespace: string;
  reference: string;
  identifier?: string;
}

/**
 * Saves AssetDID's information into our Data Base.
 *
 * @param subjectId in Codec (SCALE), specifically KiltAssetDidsV1AssetDid
 * @returns Returns the AssetDID-URI, also known as AssetDID-ID. Type "string".
 */
export async function saveAssetDid(
  subjectId: KiltAssetDidsV1AssetDid
): Promise<AssetDID["id"]> {
  const assetObject = subjectId.toJSON() as unknown as ISubjectId;

  logger.info("assetObject: " + JSON.stringify(assetObject));

  let chain: IChain;
  let asset: IAsset;

  if (subjectId.chainId.isGeneric) {
    const chainId = subjectId.chainId.asGeneric;
    chain = {
      namespace: chainId.namespace.toUtf8(), // the chain should not allow uppercase here
      reference: chainId.reference.toUtf8(),
    };
  } else {
    // 'Eip155' | 'Bip122' | 'Dotsama' | 'Solana'
    chain = {
      namespace: subjectId.chainId.type.toLowerCase(),
      reference: subjectId.chainId.value.toHex().split("x")[1],
    };
  }

  logger.info(`chain object from assetDID: ${JSON.stringify(chain, null, 2)}`);

  if (subjectId.assetId.isGeneric) {
    const assetId = subjectId.assetId.asGeneric;
    asset = {
      namespace: assetId.namespace.toUtf8(),
      reference: assetId.reference.toUtf8(),
      identifier: assetId.id.unwrapOr(undefined)?.toUtf8(),
    };
  } else {
    // 'Slip44' | 'Erc20' | 'Erc721' | 'Erc1155'
    asset = {
      namespace: subjectId.assetId.type.toLowerCase(),
      reference: subjectId.assetId.value.toString(),
    };
  }

  logger.info(`asset object from assetDID: ${JSON.stringify(asset, null, 2)}`);

  const chainComponent = chain.namespace + ":" + chain.reference;

  const assetComponent =
    asset.namespace +
    ":" +
    asset.reference +
    (asset.identifier ? ":" + asset.identifier : "");

  const assetDidUri = "did:asset:" + chainComponent + "." + assetComponent;

  const exists = await AssetDID.get(assetDidUri);
  // Existence check not really necessary
  // If you create the same twice, it just get overwritten with the same info
  if (!exists) {
    await Chain.create({
      id: chainComponent,
      namespace: chain.namespace,
      reference: chain.reference,
    }).save();

    await Asset.create({
      id: assetComponent,
      namespace: asset.namespace,
      reference: asset.reference,
      identifier: asset.identifier,
    }).save();

    const newAssetDID = AssetDID.create({
      id: assetDidUri,
      chainId: chainComponent,
      assetId: assetComponent,
    });

    logger.info(
      `AssetDID being saved: ${JSON.stringify(newAssetDID, null, 2)}`
    );

    await newAssetDID.save();
  }
  return assetDidUri;
}
