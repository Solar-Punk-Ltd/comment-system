import { Bee, FeedIndex } from "@ethersphere/bee-js";

import { isReactionArray } from "./asserts/models.assert";
import { Options } from "./model/options.model";
import { Reaction, ReactionsWithIndex } from "./model/reaction.model";
import { prepareReadOptions, prepareWriteOptions } from "./utils/common";
import { ReactionError } from "./utils/errors";
import { getReactionFeedId } from "./utils/reactions";
import { getAddressFromIdentifier, getPrivateKeyFromIdentifier } from "./utils/url";

export async function writeReactionsToIndex(
  reactions: Reaction[],
  index?: FeedIndex,
  options?: Options,
): Promise<void> {
  const { identifier, stamp, beeApiUrl, signer: optionsSigner } = await prepareWriteOptions(options);

  if (reactions.length === 0) {
    console.debug("No reactions to write");
    return;
  }

  const signer = optionsSigner || getPrivateKeyFromIdentifier(identifier);
  const bee = new Bee(beeApiUrl);

  const reactionFeedId = getReactionFeedId(reactions[0].targetMessageId);
  try {
    const { reference } = await bee.uploadData(stamp, JSON.stringify(reactions));
    const feedWriter = bee.makeFeedWriter(reactionFeedId.toUint8Array(), signer.toUint8Array());

    await feedWriter.uploadReference(stamp, reference.toUint8Array(), index === undefined ? undefined : { index });
  } catch (error) {
    console.debug("Error while writing reaction data: ", error);
  }
}

// TODO: generic feed reader/writer func for both comments and reactions
export async function readReactionsWithIndex(
  index?: FeedIndex,
  options?: Options,
): Promise<ReactionsWithIndex | undefined> {
  const { identifier, beeApiUrl, address: optionsAddress } = await prepareReadOptions(options);

  const bee = new Bee(beeApiUrl);
  const address = optionsAddress || getAddressFromIdentifier(identifier);

  const feedReader = bee.makeFeedReader(identifier, address);

  let reactions: Reaction[] = [];
  let nextIndex: string;
  let reactionData: any;
  try {
    if (index === undefined) {
      const feedUpdate = await feedReader.download();
      const { feedIndexNext, payload } = feedUpdate;
      reactionData = payload.toJSON();
      nextIndex = feedIndexNext?.toString() || FeedIndex.fromBigInt(0n).toString();
    } else {
      const feedUpdate = await feedReader.downloadReference({ index });
      nextIndex = FeedIndex.fromBigInt(index.toBigInt() + 1n).toString();
      const data = await bee.downloadData(feedUpdate.reference.toUint8Array());
      reactionData = data.toJSON();
    }

    if (isReactionArray(reactionData)) {
      reactions = reactionData;
    } else {
      throw new ReactionError(`Invalid reactions format: ${JSON.stringify(reactionData)}`);
    }
  } catch (error) {
    console.debug("Error while reading reactions: ", error);
    return;
  }

  return { reactions: reactions, nextIndex: nextIndex };
}
