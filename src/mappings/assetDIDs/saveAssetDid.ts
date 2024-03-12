import type { Codec } from "@polkadot/types-codec/types";
import { Asset, AssetDID, Chain } from "../../types";

interface ISubjectId {
  chainId: {
    [key: string]: string;
  };
  assetId: {
    [key: string]: string[];
  };
}

/**
 * Saves AssetDID's information into our Data Base.
 *
 * @param subjectId
 * @returns Returns the AssetDID-URI, also known as AssetDID-ID. Type "string".
 */
export async function saveAssetDid(subjectId: Codec): Promise<AssetDID["id"]> {
  const assetObject = subjectId.toJSON() as unknown as ISubjectId;

  logger.info("assetObject: " + JSON.stringify(assetObject));

  const chain = {
    namespace: Object.keys(assetObject.chainId)[0],
    reference: Object.values(assetObject.chainId)[0],
  };

  const asset = {
    namespace: Object.keys(assetObject.assetId)[0],
    reference: Object.values(assetObject.assetId)[0][0],
    identifier: Object.values(assetObject.assetId)[0][1],
  };

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
