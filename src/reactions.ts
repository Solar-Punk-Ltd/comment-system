import { Bee, Bytes, FeedIndex } from "@ethersphere/bee-js";
import { v4 as uuid } from "uuid";

import { isReactionArray } from "./asserts/models.assert";
import { Options } from "./model/options.model";
import { Reaction, ReactionsWithIndex } from "./model/reaction.model";
import { prepareReadOptions, prepareWriteOptions } from "./utils/common";
import { getReactionFeedId } from "./utils/reactions";
import { getAddressFromIdentifier, getPrivateKeyFromIdentifier } from "./utils/url";

export async function writeReaction(reaction: Reaction, options?: Options): Promise<Reaction> {
  return {} as Reaction;
}

export async function writeReactionsToIndex(
  newReaction: Reaction,
  reactions: Reaction[],
  index?: FeedIndex,
  options?: Options,
): Promise<Reaction[] | undefined> {
  const { identifier, stamp, beeApiUrl, signer: optionsSigner } = await prepareWriteOptions(options);
  if (index === undefined) {
    console.debug("No index defined");
    return;
  }

  const reactionFeedId = getReactionFeedId(identifier);
  const newReactionObject: Reaction = {
    ...newReaction,
    reactionId: newReaction.reactionId || uuid(),
  };

  const signer = optionsSigner || getPrivateKeyFromIdentifier(identifier);
  const bee = new Bee(beeApiUrl);

  // todo: merge reactions : remove + add
  const mergedReactions = [...reactions, newReactionObject];
  try {
    const { reference } = await bee.uploadData(stamp, JSON.stringify(mergedReactions));
    console.debug("Reaction data upload successful: ", reference);
    const feedWriter = bee.makeFeedWriter(new Bytes(reactionFeedId).toUint8Array(), signer.toUint8Array());

    const feedResult = await feedWriter.uploadReference(stamp, reference, { index });
    console.debug("Reaction feed updated: ", feedResult.reference);

    return mergedReactions;
  } catch (error) {
    console.debug("Error while writing reaction data: ", error);
    return;
  }
}

export async function readReactions(options?: Options): Promise<Reaction[]> {
  return [] as Reaction[];
}

// TODO: generic feed reader/writer func for both comments and reactions
// TODO: reaction aggregate functions
export async function readReactionsWithIndex(
  index?: FeedIndex,
  options?: Options,
): Promise<ReactionsWithIndex | undefined> {
  const { identifier, beeApiUrl, address: optionsAddress } = await prepareReadOptions(options);

  const bee = new Bee(beeApiUrl);
  const address = optionsAddress || getAddressFromIdentifier(identifier);

  const feedReader = bee.makeFeedReader(new Bytes(identifier).toUint8Array(), address);

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
      throw new Error(`Invalid reactions format: ${JSON.stringify(reactionData)}`);
    }
  } catch (error) {
    console.debug("Error while reading reactions: ", error);
    return;
  }

  return { reactions: reactions, nextIndex: nextIndex };
}
