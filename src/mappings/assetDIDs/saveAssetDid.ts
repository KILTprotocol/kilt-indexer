import type { Codec } from "@polkadot/types-codec/types";
import { Asset, AssetDID, Chain } from "../../types";
import {
  AssetDidUri,
  KiltPublishedCredentialCollectionV1Type,
} from "@kiltprotocol/types";

import { base58Encode, encodeAddress } from "@polkadot/util-crypto";

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

  const { chainId, assetId } = subjectId;

  logger.info("assetObject: " + JSON.stringify(assetObject));

  let chain: IChain;
  let asset: IAsset;

  switch (chainId.type) {
    case "Generic":
      const genericChainId = chainId.asGeneric;
      chain = {
        namespace: genericChainId.namespace.toUtf8(), // the chain should not allow uppercase here
        reference: genericChainId.reference.toUtf8(),
      };
      break;
    case "Dotsama":
      chain = {
        namespace: "polkadot",
        reference: chainId.asDotsama.toHex().split("x")[1],
      };
      break;
    case "Eip155":
      chain = {
        namespace: "eip155",
        reference: chainId.asEip155.toBigInt().toString(),
      };
      break;

    // TODO: Show this to Antonio
    case "Solana":
      logger.info(
        "asSolana: bytes length of chainId reference for solana:" +
          chainId.asSolana.byteLength
      );
      logger.info(
        "toU8a(false): bytes length of chainId reference for solana:" +
          chainId.asSolana.toU8a(false).byteLength
      );
      logger.info(
        "toU8a(true) bytes length of chainId reference for solana:" +
          chainId.asSolana.toU8a(true).byteLength
      );
      logger.info(
        "U8a of chainId reference for solana:" + chainId.asSolana.toU8a()
      );
      logger.info(
        "Hex String of chainId reference for solana:" + chainId.asSolana.toHex()
      );
      chain = {
        namespace: "solana",
        reference: base58Encode(chainId.asSolana.toHex()),

        // reference: encodeAddress(chainId.asSolana.toU8a(), undefined), // throws error

        // reference: base58Encode(chainId.asSolana.toU8a(), false), // a longer and wrong base58 representation
        // reference: chainId.asSolana.toUtf8(), // not the base58 representation. comes out as string with characters that do not follow the specifications (like ",")
        // reference: chainId.asSolana.toString(), // not the base58 representation. comes out as hex
        // reference: chainId.asSolana.toHuman() as string, // not the base58 representation. comes out as hex
      };
      break;

    default:
      //  'Bip122' | 'Solana'
      chain = {
        namespace: chainId.type.toLowerCase(),
        reference: chainId.value.toHex().split("x")[1],
      };
      break;
  }

  logger.info(`chain object from subjectId: ${JSON.stringify(chain, null, 2)}`);

  switch (assetId.type) {
    // "Generic" | "Slip44" | "Erc20" | "Erc721" | "Erc1155"
    case "Generic":
      const genericAssetId = assetId.asGeneric;
      asset = {
        namespace: genericAssetId.namespace.toUtf8(),
        reference: genericAssetId.reference.toUtf8(),
        identifier: genericAssetId.id.unwrapOr(undefined)?.toUtf8(),
      };
      break;
    case "Erc721":
      const erc721AssetId = assetId.asErc721;
      asset = {
        namespace: "erc721",
        reference: erc721AssetId[0].toHex(),
        identifier: erc721AssetId[1].unwrapOr(undefined)?.toUtf8(),
      };
      break;
    case "Erc1155":
      const erc1155AssetId = assetId.asErc1155;
      asset = {
        namespace: "erc1155",
        reference: erc1155AssetId[0].toHex(),
        identifier: erc1155AssetId[1].unwrapOr(undefined)?.toUtf8(),
      };
      break;
    default:
      // 'Slip44' | 'Erc20'
      asset = {
        namespace: subjectId.assetId.type.toLowerCase(),
        reference: subjectId.assetId.value.toString(),
      };
      break;
  }

  logger.info(`asset object from subjectId: ${JSON.stringify(asset, null, 2)}`);

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
