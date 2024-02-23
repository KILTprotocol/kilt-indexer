import type { SubstrateEvent } from "@subql/types";
import { Asset, AssetDID, Chain } from "../../types";
import { saveBlock } from "../blocks/saveBlock";
import { UNKNOWN } from "../mappingHandlers";

export async function handlePublicCredentialStored(
  event: SubstrateEvent
): Promise<void> {
  // A new public credential has been issued.\[subject_id, credential_id\]"
  const {
    block,
    event: {
      data: [objectID, credentialID],
    },
    extrinsic,
  } = event;

  logger.info(
    `New Public Credential registered at block ${block.block.header.number}`
  );

  logger.info(
    `The whole CredentialStored event: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);

  interface SubjectId {
    chainId: {
      [key: string]: string;
    };
    assetId: {
      [key: string]: string[];
    };
  }

  const assetObject = objectID.toHuman() as unknown as SubjectId;

  logger.info("assetObject: " + JSON.stringify(assetObject));

  const chain: Chain = {
    namespace: Object.keys(assetObject.chainId)[0],
    reference: Object.values(assetObject.chainId)[0],
  };

  const asset: Asset = {
    namespace: Object.keys(assetObject.assetId)[0],
    reference: Object.values(assetObject.assetId)[0][0],
    identifier: Object.values(assetObject.assetId)[0][1],
  };

  const chainComponent = chain.namespace.toLowerCase() + ":" + chain.reference;
  const assetComponent =
    asset.namespace.toLowerCase() +
    ":" +
    asset.reference +
    (asset.identifier ? ":" + asset.identifier : "");

  const id = "did:asset:" + chainComponent + "." + assetComponent;

  const newAssetDID = AssetDID.create({
    id,
    chain,
    asset,
  });

  await newAssetDID.save();
}
