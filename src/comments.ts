import { Bee, Bytes, FeedIndex } from "@ethersphere/bee-js";
import { Types } from "cafe-utility";
import { v4 as uuidv4 } from "uuid";

import { isUserComment, isLegacyUserComment } from "./asserts/models.assert";
import { CommentNode, SingleMessage, MessageData } from "./model/comment.model";
import { Options } from "./model/options.model";
import {
  isNotFoundError,
  prepareReadOptions,
  prepareWriteOptions,
  readFeedData,
  transformLegacyComment,
  writeFeedData,
} from "./utils/common";
import { FeedReferenceResult } from "./utils/types";
import { getAddressFromIdentifier, getPrivateKeyFromIdentifier } from "./utils/url";
import { commentListToTree } from "./utils";

/**
 * Write a comment to the next index of the feed with the given options.
 *
 * @param comment The comment object to write to the feed.
 * @param options The options to use for writing the comment.
 * @throws PrivateKeyError if no privatekey is provided and it cannot be generated from the url.
 * @throws IdentifierError if no identifier is provided and it cannot be generated from the privatekey.
 * @throws StampError if no valid stamp is found.
 *
 * @returns The comment object that was written to the feed or undefined in case of failure.
 */
export async function writeComment(comment: MessageData, options?: Options): Promise<MessageData | undefined> {
  const { identifier, stamp, beeApiUrl, signer: optionsSigner } = await prepareWriteOptions(options);

  const signer = optionsSigner || getPrivateKeyFromIdentifier(identifier);

  const bee = new Bee(beeApiUrl);

  const userCommentObj: MessageData = {
    ...comment,
    id: comment.id || uuidv4(),
    timestamp: Types.isNumber(comment.timestamp) ? comment.timestamp : new Date().getTime(),
  };

  try {
    await writeFeedData(
      bee,
      new Bytes(identifier).toUint8Array(),
      stamp,
      signer.toUint8Array(),
      JSON.stringify(userCommentObj),
    );

    return userCommentObj;
  } catch (err) {
    console.error("Error while writing comment: ", err);
    return;
  }
}

/**
 * Write a comment to a specific index of the feed with the given options.
 * Defaults to @writeComment if no index is provided.
 *
 * @param comment The comment object to write to the feed.
 * @param index The index to write the comment to.
 * @param options The options to use for writing the comment.
 * @throws PrivateKeyError if no privatekey is provided and it cannot be generated from the url.
 * @throws IdentifierError if no identifier is provided and it cannot be generated from the privatekey.
 * @throws StampError if no valid stamp is found.
 *
 * @returns The comment object that was written to the feed or undefined in case of failure.
 */
export async function writeCommentToIndex(
  comment: MessageData,
  index?: FeedIndex,
  options?: Options,
): Promise<MessageData | undefined> {
  const { identifier, stamp, beeApiUrl, signer: optionsSigner } = await prepareWriteOptions(options);
  if (index === undefined) {
    console.debug("No index defined - writing comment to the latest index");
    return writeComment(comment, options);
  }

  const signer = optionsSigner || getPrivateKeyFromIdentifier(identifier);

  const bee = new Bee(beeApiUrl);

  const userCommentObj: MessageData = {
    ...comment,
    id: comment.id || uuidv4(),
    timestamp: Types.isNumber(comment.timestamp) ? comment.timestamp : new Date().getTime(),
  };

  try {
    await writeFeedData(
      bee,
      new Bytes(identifier).toUint8Array(),
      stamp,
      signer.toUint8Array(),
      JSON.stringify(userCommentObj),
      index,
    );

    return userCommentObj;
  } catch (err) {
    console.error(`Error while writing comment: ${err}`);
    return;
  }
}

/**
 * Read comments in succession until the latest index of the feed with the given options.
 *
 * @param options The options to use for reading the comment.
 * @throws PrivateKeyError if no privatekey is provided and it cannot be generated from the url.
 * @throws IdentifierError if no identifier is provided and it cannot be generated from the privatekey.
 *
 * @returns The the array of comment objects that were read from the feed or undefined in case of failure.
 */
export async function readComments(options?: Options): Promise<MessageData[] | undefined> {
  const { identifier, beeApiUrl, address: optionsAddress } = await prepareReadOptions(options);

  const bee = new Bee(beeApiUrl);

  const address = optionsAddress || getAddressFromIdentifier(identifier);

  const userComments: MessageData[] = [];

  let nextIndex = 0n;

  while (true) {
    try {
      const { objectdata: commentData } = await readFeedData(
        bee,
        new Bytes(identifier).toUint8Array(),
        address,
        FeedIndex.fromBigInt(nextIndex++),
      );

      if (isUserComment(commentData)) {
        userComments.push(commentData);
      } else if (isLegacyUserComment(commentData)) {
        userComments.push(
          transformLegacyComment(commentData, address.toString(), (nextIndex - 1n).toString(), identifier),
        );
      } else {
        throw new TypeError(`Invalid comment format: ${JSON.stringify(commentData)}`);
      }
    } catch (err) {
      if (!isNotFoundError(err)) {
        console.error(`Error while reading comments at index ${(nextIndex - 1n).toString()}:`, err);
        return;
      }

      break;
    }
  }

  return userComments;
}

/**
 * Read nested comments in succession until the latest index of the feed with the given options.
 *
 * @param start The start index of the range.
 * @param end The end index of the range.
 * @param options The options to use for reading the comment.
 * @throws PrivateKeyError if no privatekey is provided and it cannot be generated from the url.
 * @throws IdentifierError if no identifier is provided and it cannot be generated from the privatekey.
 *
 * @returns The the array of nested comment objects that were read from the feed or undefined in case of failure.
 */
export async function readCommentsAsTree(
  start?: FeedIndex,
  end?: FeedIndex,
  options?: Options,
): Promise<CommentNode[] | undefined> {
  const userComments = await readCommentsInRange(start, end, options);
  if (!userComments) {
    return userComments;
  }

  return commentListToTree(userComments);
}

/**
 * Read comments in parallel within the provided range of indices of the feed with the given options.
 * Defaults to @readComments if no start or end index is provided.
 *
 * @param start The start index of the range.
 * @param end The end index of the range.
 * @param options The options to use for reading the comment.
 * @throws PrivateKeyError if no privatekey is provided and it cannot be generated from the url.
 * @throws IdentifierError if no identifier is provided and it cannot be generated from the privatekey.
 *
 * @returns The the array of comment objects that were read from the feed or undefined in case of failure.
 */
export async function readCommentsInRange(
  start?: FeedIndex,
  end?: FeedIndex,
  options?: Options,
): Promise<MessageData[] | undefined> {
  const { identifier, beeApiUrl, address: optionsAddress } = await prepareReadOptions(options);
  if (start === undefined || end === undefined) {
    console.debug("No start or end index - reading comments synchronously");
    return await readComments(options);
  }

  const bee = new Bee(beeApiUrl);
  const address = optionsAddress || getAddressFromIdentifier(identifier);

  const feedReader = bee.makeFeedReader(new Bytes(identifier).toUint8Array(), address);

  const userComments: MessageData[] = [];
  const actualStart = end > start ? start.toBigInt() : end.toBigInt();
  const feedUpdatePromises: Promise<FeedReferenceResult>[] = [];
  let i = actualStart;

  try {
    for (i; i <= end.toBigInt(); i++) {
      feedUpdatePromises.push(feedReader.downloadReference({ index: FeedIndex.fromBigInt(i) }));
    }
    const dataPromises: Promise<Bytes>[] = [];
    await Promise.allSettled(feedUpdatePromises).then(results => {
      results.forEach(result => {
        if (result.status === "fulfilled") {
          dataPromises.push(bee.downloadData(result.value.reference.toUint8Array()));
        } else {
          console.debug("Failed to fetch feed update: ", result.reason);
        }
      });
    });

    await Promise.allSettled(dataPromises).then(results => {
      results.forEach(result => {
        if (result.status === "fulfilled") {
          const commentData = (result.value as Bytes).toJSON();
          if (isUserComment(commentData)) {
            userComments.push(commentData);
          } else if (isLegacyUserComment(commentData)) {
            userComments.push(transformLegacyComment(commentData, address.toString(), i.toString(), identifier));
          } else {
            console.error(`Invalid comment format: ${JSON.stringify(commentData)}`);
          }
        } else {
          console.debug("Failed to fetch comment data: ", result.reason);
        }
      });
    });
  } catch (err) {
    if (!isNotFoundError(err)) {
      console.error(`Error while reading comments from ${start.toString()} to ${end.toString()}: ${err}`);
      return;
    }

    console.debug(`No comment found at index ${i.toString()}`);
  }

  userComments.sort((a, b) => a.timestamp - b.timestamp);

  return userComments;
}

/**
 * Read a single comment at the provided index of the feed with the given options.
 * Reads the latest comment if no index is provided, in which case the next index is also returned.
 *
 * @param index The index of the comment to read.
 * @param options The options to use for reading the comment.
 * @throws PrivateKeyError if no privatekey is provided and it cannot be generated from the url.
 * @throws IdentifierError if no identifier is provided and it cannot be generated from the privatekey.
 *
 * @returns The the comment object that was read from the feed or undefined in case of failure.
 */
export async function readSingleComment(index?: FeedIndex, options?: Options): Promise<SingleMessage | undefined> {
  const { identifier, beeApiUrl, address: optionsAddress } = await prepareReadOptions(options);

  const bee = new Bee(beeApiUrl);
  const address = optionsAddress || getAddressFromIdentifier(identifier);

  const singleComment: SingleMessage = {} as SingleMessage;
  try {
    const { objectdata: commentData, nextIndex } = await readFeedData(
      bee,
      new Bytes(identifier).toUint8Array(),
      address,
      index,
    );

    if (isUserComment(commentData)) {
      singleComment.message = commentData;
      singleComment.nextIndex = nextIndex;
    } else if (isLegacyUserComment(commentData)) {
      singleComment.message = transformLegacyComment(
        commentData,
        address.toString(),
        (BigInt(nextIndex) - 1n).toString(),
        identifier,
      );
      singleComment.nextIndex = nextIndex;
    } else {
      throw new TypeError(`Invalid comment format: ${JSON.stringify(commentData)}`);
    }
  } catch (err) {
    if (!isNotFoundError(err)) {
      console.error(`Error while reading single comment at index ${index?.toString()}: ${err}`);
      return;
    }

    console.debug(`No comment found at index ${index?.toString()}`);
  }

  return singleComment;
}
