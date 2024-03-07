import { Asset, AssetDID, Chain } from "../../types";
import { UNKNOWN } from "../mappingHandlers";

/** Solves problems while trying to start Data Base from higher block.
 *
 * TODO: This function should be deleted before deployment.
 *
 * Saves a dummy prehistoric AssetDID's information into our Data Base.
 *
 * @returns Returns the AssetDID-URI, also known as AssetDID-ID. Type "string".
 */
export async function createPrehistoricAssetDid(): Promise<AssetDID["id"]> {
  const prehistoricAssetDidUri = "did:asset:" + UNKNOWN + "." + UNKNOWN;

  const exists = await AssetDID.get(prehistoricAssetDidUri);
  // Existence check not really necessary
  // If you create the same twice, it just get overwritten with the same info
  if (!exists) {
    await Chain.create({
      id: UNKNOWN,
      namespace: UNKNOWN,
      reference: UNKNOWN,
    }).save();

    await Asset.create({
      id: UNKNOWN,
      namespace: UNKNOWN,
      reference: UNKNOWN,
    }).save();

    const prehistoricAssetDID = AssetDID.create({
      id: prehistoricAssetDidUri,
      chainId: UNKNOWN,
      assetId: UNKNOWN,
    });

    logger.info(
      `Prehistoric AssetDID being saved: ${JSON.stringify(
        prehistoricAssetDID,
        null,
        2
      )}`
    );

    await prehistoricAssetDID.save();
  }
  return prehistoricAssetDidUri;
}
