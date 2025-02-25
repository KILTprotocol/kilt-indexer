import type { SubstrateBlock } from "@subql/types";
import { Block } from "../../types";
import assert from "assert";

/**
 * Saves Block information into our Data Base.
 *
 * @param block
 * @returns Returns the Block-Number, also known as Block-ID. Type "string".
 */
export async function saveBlock(block: SubstrateBlock): Promise<Block["id"]> {
  const blockNumber = block.block.header.number.toString().padStart(9, "0");
  const blockHash = block.block.hash.toHex();
  const issuanceDate = block.timestamp;

  assert(issuanceDate, `Block #${blockNumber} is missing its time stamp.`);

  const exists = await Block.get(blockNumber);
  // Existence check not really necessary if we trust the chain
  // If you create the same block twice, it just get overwritten with the same info
  if (!exists) {
    const block = Block.create({
      id: blockNumber,
      hash: blockHash,
      timeStamp: issuanceDate,
    });

    logger.trace(`Block being saved: ${JSON.stringify(block, null, 2)}`);

    await block.save();
  } else {
    // To prove my theory:
    const conditions: boolean =
      blockHash === exists.hash &&
      blockNumber === exists.id &&
      issuanceDate.getTime() === exists.timeStamp.getTime();

    assert(conditions, `Inconsistent Block! ${blockNumber}`);

    // TODO: delete that Existence Check (& the printing) after running it for a while
  }
  return blockNumber;
}
