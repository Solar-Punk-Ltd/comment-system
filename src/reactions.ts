import { Bee, FeedIndex, UploadResult } from "@ethersphere/bee-js";

import { isReactionArray } from "./asserts/models.assert";
import { Options } from "./model/options.model";
import { isNotFoundError, prepareReadOptions, prepareWriteOptions, readFeedData, writeFeedData } from "./utils/common";
import { getAddressFromIdentifier, getPrivateKeyFromIdentifier } from "./utils/url";
import { MessageData, MessagesWithIndex } from "./model";

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
 * @returns An UploadResult object returned by the feed update or undefined in case of failure.
 */
export async function writeReactionsToIndex(
  reactions: MessageData[],
  index?: FeedIndex,
  options?: Options,
): Promise<UploadResult | undefined> {
  const { identifier, stamp, beeApiUrl, signer: optionsSigner } = await prepareWriteOptions(options);

  const signer = optionsSigner || getPrivateKeyFromIdentifier(identifier);
  const bee = new Bee(beeApiUrl);

  try {
    return await writeFeedData(bee, identifier, stamp, signer.toUint8Array(), JSON.stringify(reactions), index);
  } catch (err: any) {
    console.error("Error while writing reaction data: ", err.message || err);
    return;
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
export async function readReactionsWithIndex(index?: FeedIndex, options?: Options): Promise<MessagesWithIndex> {
  const { identifier, beeApiUrl, address: optionsAddress } = await prepareReadOptions(options);

  const bee = new Bee(beeApiUrl);
  const address = optionsAddress || getAddressFromIdentifier(identifier);

  const reactionsWithIndex: MessagesWithIndex = {
    messages: [],
    nextIndex: FeedIndex.MINUS_ONE.toString(),
  } as MessagesWithIndex;
  try {
    const { data, nextIndex } = await readFeedData(bee, identifier, address, index);

    if (isReactionArray(data)) {
      reactionsWithIndex.messages = data;
      reactionsWithIndex.nextIndex = FeedIndex.fromBigInt(nextIndex).toString();
    } else {
      throw new TypeError(`Invalid reactions format: ${JSON.stringify(data)}`);
    }
  } catch (err: any) {
    if (!isNotFoundError(err)) {
      console.error(`Error while reading reactions at index ${index?.toString()}:`, err.message || err);
    }

    console.debug(`No reaction found at index ${index?.toString()}`);
  }

  return reactionsWithIndex;
}
