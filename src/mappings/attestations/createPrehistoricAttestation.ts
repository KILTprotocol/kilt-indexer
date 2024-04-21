import type { SubstrateEvent } from "@subql/types";
import { CType, Attestation } from "../../types";
import { saveBlock } from "../blocks/saveBlock";
import { handleCTypeAggregations } from "../cTypes/cTypeHandlers";
import { UNKNOWN } from "../mappingHandlers";
import { createPrehistoricDID } from "../dids/createPrehistoricDID";

/**
 * Solves problems while trying to start Data Base from higher block.
 *
 * TODO: This function should be deleted before deployment.
 *
 * @param event a revocation or a removal of an attestation
 */
export async function createPrehistoricAttestation(
  event: SubstrateEvent
): Promise<Attestation> {
  logger.info(
    `An attestation from before the Database's startBlock is being added with default values.`
  );

  // The event is of one of this two types:
  // An attestation has been revoked.\[attester DID, claim hash\]
  // An attestation has been removed.\[attester DID, claim hash\]
  const {
    block,
    event: {
      data: [attesterDID, claimHash],
    },
  } = event;

  logger.trace(
    `The whole event involving a prehistoric attestation: ${JSON.stringify(
      event.toHuman(),
      null,
      2
    )}`
  );

  const blockNumber = await saveBlock(block);
  const cTypeId = "kilt:ctype:" + UNKNOWN;
  const payer = UNKNOWN;
  const issuer = await createPrehistoricDID(event);

  // craft my event ordinal index:
  const attestations = await Attestation.getByFields([
    ["creationBlockId", "=", blockNumber],
  ]);
  /** Only counts the number of attestations created on one block.
   * It will not match with the event index from subscan that count all kinds of events.
   */
  const eventIndex = attestations.length;

  const prehistoricAttestation = Attestation.create({
    id: `${blockNumber}-${eventIndex}`,
    claimHash: claimHash.toHex(),
    cTypeId: cTypeId,
    issuerId: issuer.id,
    payer: payer,
    valid: true,
    creationBlockId: blockNumber,
  });

  await prehistoricAttestation.save();

  const unknownCType = await CType.get(cTypeId);
  if (!unknownCType) {
    // Would happen only once per data base:
    await handleCTypeAggregations(cTypeId, "CREATED");
  }

  return prehistoricAttestation;
}
