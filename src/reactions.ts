import { Bee, Bytes, FeedIndex } from "@ethersphere/bee-js";
import { v4 as uuid } from "uuid";

import { isReaction } from "./asserts/models.assert";
import { isNumber } from "./asserts/general.assert";
import { Reaction } from "./model/reaction.model";
import { Options } from "./model/options.model";
import { prepareReadOptions, prepareWriteOptions } from "./utils/comments";
import { getReactionFeedId } from "./utils/reactions";
import { FeedReferenceResult } from "./utils/types";
import { getAddressFromIdentifier, getPrivateKeyFromIdentifier } from "./utils/url";

export async function writeReaction(reaction: Reaction, options?: Options): Promise<Reaction> {
  return {} as Reaction;
}

export async function writeReactionToIndex(
  reaction: Reaction,
  index?: FeedIndex,
  options?: Options,
): Promise<Reaction> {
  const { identifier, stamp, beeApiUrl, signer: optionsSigner } = await prepareWriteOptions(options);
  if (index === undefined) {
    console.debug("No index defined - writing comment to the latest index");
    return writeReaction(reaction, options);
  }

  const reactionFeedId = getReactionFeedId(identifier);
  const reactionObject: Reaction = {
    ...reaction,
    timestamp: isNumber(reaction.timestamp) ? reaction.timestamp : new Date().getTime(),
    reactionId: reaction?.reactionId || uuid(),
  };

  const signer = optionsSigner || getPrivateKeyFromIdentifier(identifier);
  const bee = new Bee(beeApiUrl);

  try {
    const { reference } = await bee.uploadData(stamp, JSON.stringify(reactionObject));
    console.debug("Reaction data upload successful: ", reference);
    const feedWriter = bee.makeFeedWriter(new Bytes(reactionFeedId).toUint8Array(), signer.toUint8Array());

    const feedResult = await feedWriter.uploadReference(stamp, reference, { index });
    console.debug("Reaction feed updated: ", feedResult.reference);

    return reactionObject;
  } catch (error) {
    console.debug("Error while writing reaction data: ", error);
    return {} as Reaction;
  }
}

export async function readReactions(options?: Options): Promise<Reaction[]> {
  return [] as Reaction[];
}

// TODO: generic feed reader/writer func for both comments and reactions
// TODO: reaction aggregate functions
export async function readReactionsInRange(start?: FeedIndex, end?: FeedIndex, options?: Options): Promise<Reaction[]> {
  const { identifier, beeApiUrl, address: optionsAddress } = await prepareReadOptions(options);
  if (start === undefined || end === undefined) {
    console.debug("No start or end index - reading comments synchronously");
    return await readReactions(options);
  }

  const bee = new Bee(beeApiUrl);
  const address = optionsAddress || getAddressFromIdentifier(identifier);
  const reactionFeedId = getReactionFeedId(identifier);

  const feedReader = bee.makeFeedReader(new Bytes(reactionFeedId).toUint8Array(), address);

  const reactions: Reaction[] = [];

  try {
    const actualStart = end > start ? start.toBigInt() : end.toBigInt();
    const feedUpdatePromises: Promise<FeedReferenceResult>[] = [];
    for (let i = actualStart; i <= end.toBigInt(); i++) {
      feedUpdatePromises.push(feedReader.downloadReference({ index: FeedIndex.fromBigInt(i) }));
    }
    const dataPromises: Promise<Bytes>[] = [];
    await Promise.allSettled(feedUpdatePromises).then(results => {
      results.forEach(result => {
        if (result.status === "fulfilled") {
          dataPromises.push(bee.downloadData(result.value.reference.toUint8Array()));
        } else {
          console.debug("Failed fetching feed update: ", result.reason);
        }
      });
    });

    await Promise.allSettled(dataPromises).then(results => {
      results.forEach(result => {
        if (result.status === "fulfilled") {
          const reaction = (result.value as Bytes).toJSON();
          if (isReaction(reaction)) {
            reactions.push(reaction);
          }
        } else {
          console.debug("Failed fetching reaction data: ", result.reason);
        }
      });
    });
  } catch (err) {
    console.debug(`Error while reading reactions from ${start} to ${end}: ${err}`);
    return [] as Reaction[];
  }

  reactions.sort((a, b) => a.timestamp - b.timestamp);

  return reactions;
}
