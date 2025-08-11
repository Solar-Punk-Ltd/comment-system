import { Bee, FeedIndex } from "@ethersphere/bee-js";

import { isReactionArray } from "./asserts/models.assert";
import { Options } from "./model/options.model";
import { isNotFoundError, prepareReadOptions, prepareWriteOptions, readFeedData, writeFeedData } from "./utils/common";
import { ReactionError } from "./utils/errors";
import { getAddressFromIdentifier, getPrivateKeyFromIdentifier } from "./utils/url";
import { MessageData, MessageWithIndex } from "./model";

/**
 * Writes a list of reactions to a feed index using the Bee API.
 *
 * @param reactions - An array of `Reaction` objects to be written to the feed.
 * @param index - (Optional) The feed index to which the reactions will be written. If not provided, the default index is used.
 * @param options The options to use for writing the reactions.
 * @throws PrivateKeyError if no privatekey is provided and it cannot be generated from the url.
 * @throws IdentifierError if no identifier is provided and it cannot be generated from the privatekey.
 * @throws StampError if no valid stamp is found.
 *
 * @returns A promise that resolves when the reactions have been successfully written to the feed or undefined in case of failure.
 */
export async function writeReactionsToIndex(
  reactions: MessageData[],
  index?: FeedIndex,
  options?: Options,
): Promise<void> {
  const { identifier, stamp, beeApiUrl, signer: optionsSigner } = await prepareWriteOptions(options);

  const signer = optionsSigner || getPrivateKeyFromIdentifier(identifier);
  const bee = new Bee(beeApiUrl);

  try {
    await writeFeedData(bee, identifier, stamp, signer.toUint8Array(), JSON.stringify(reactions), index);
  } catch (error) {
    console.debug("Error while writing reaction data: ", error);
  }
}

/**
 * Reads and array of reaction objects from a feed.
 *
 * @param index - (Optional) The feed index from which the reactions will be read. If not provided, a lookup is performed.
 * @param options The options to use for writing the reactions.
 * @throws {ReactionError} If the reaction data format is invalid.
 * @throws PrivateKeyError if no privatekey is provided and it cannot be generated from the url.
 * @throws IdentifierError if no identifier is provided and it cannot be generated from the privatekey.
 *
 * @returns A reactions array that was read from the feed or undefined in case of failure.
 */
export async function readReactionsWithIndex(
  index?: FeedIndex,
  options?: Options,
): Promise<MessageWithIndex | undefined> {
  const { identifier, beeApiUrl, address: optionsAddress } = await prepareReadOptions(options);

  const bee = new Bee(beeApiUrl);
  const address = optionsAddress || getAddressFromIdentifier(identifier);

  const reactionsWithIndex: MessageWithIndex = {} as MessageWithIndex;
  try {
    const { objectdata: reactionData, nextIndex } = await readFeedData(bee, identifier, address, index);

    if (isReactionArray(reactionData)) {
      reactionsWithIndex.messages = reactionData;
      reactionsWithIndex.nextIndex = FeedIndex.fromBigInt(nextIndex).toString();
    } else {
      throw new ReactionError(`Invalid reactions format: ${JSON.stringify(reactionData)}`);
    }
  } catch (err) {
    if (!isNotFoundError(err)) {
      console.error(`Error while reading reactions at index ${index?.toString()}:`, err);
      return;
    }

    console.debug(`No reaction found at index ${index?.toString()}`);
  }

  return reactionsWithIndex;
}
