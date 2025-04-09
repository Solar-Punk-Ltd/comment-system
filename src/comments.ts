import { Bee, Bytes, FeedIndex } from "@ethersphere/bee-js";
import { v4 as uuid } from "uuid";

import { isUserComment } from "./asserts/models.assert";
import { Comment, CommentNode, SingleComment, UserComment } from "./model/comment.model";
import { Options } from "./model/options.model";
import { prepareReadOptions, prepareWriteOptions } from "./utils/comments";
import { FeedReferenceResult } from "./utils/types";
import { getAddressFromIdentifier, getPrivateKeyFromIdentifier } from "./utils/url";
import { commentListToTree } from "./utils";
import { isNumber } from "./asserts/general.assert";

/**
 * Write a comment to the next index of the feed with the given options.
 *
 * @param comment The comment object to write to the feed.
 * @param options The options to use for writing the comment.
 * @throws PrivateKeyError if no privatekey is provided and it cannot be generated from the url.
 * @throws IdentifierError if no identifier is provided and it cannot be generated from the privatekey.
 * @throws StampError if no valid stamp is found.
 *
 * @returns The comment object that was written to the feed.
 */
export async function writeComment(comment: UserComment, options?: Options): Promise<UserComment> {
  const { identifier, stamp, beeApiUrl, signer: optionsSigner } = await prepareWriteOptions(options);

  const signer = optionsSigner || getPrivateKeyFromIdentifier(identifier);

  const bee = new Bee(beeApiUrl);

  const commentObject: Comment = {
    ...comment.message,
    messageId: comment.message.messageId || uuid(),
  };

  const userCommentObj: UserComment = {
    message: commentObject,
    timestamp: isNumber(comment.timestamp) ? comment.timestamp : new Date().getTime(),
    user: comment.user,
  };

  try {
    const { reference } = await bee.uploadData(stamp, JSON.stringify(userCommentObj));
    console.debug("Comment data upload successful: ", reference);
    const feedWriter = bee.makeFeedWriter(new Bytes(identifier).toUint8Array(), signer.toUint8Array());
    const feedResult = await feedWriter.uploadReference(stamp, reference);
    console.debug("Comment feed updated: ", feedResult.reference);

    return userCommentObj;
  } catch (error) {
    console.debug("Error while writing comment: ", error);
    return {} as UserComment;
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
 * @returns The comment object that was written to the feed.
 */
export async function writeCommentToIndex(
  comment: UserComment,
  index?: FeedIndex,
  options?: Options,
): Promise<UserComment> {
  const { identifier, stamp, beeApiUrl, signer: optionsSigner } = await prepareWriteOptions(options);
  if (index === undefined) {
    console.debug("No index defined - writing comment to the latest index");
    return writeComment(comment, options);
  }

  const signer = optionsSigner || getPrivateKeyFromIdentifier(identifier);

  const bee = new Bee(beeApiUrl);

  const commentObject: Comment = {
    ...comment.message,
    messageId: comment.message.messageId || uuid(),
  };

  const userCommentObj: UserComment = {
    message: commentObject,
    timestamp: isNumber(comment.timestamp) ? comment.timestamp : new Date().getTime(),
    user: comment.user,
  };

  try {
    const { reference } = await bee.uploadData(stamp, JSON.stringify(userCommentObj));
    console.debug("Comment data upload successful: ", reference);
    const feedWriter = bee.makeFeedWriter(new Bytes(identifier).toUint8Array(), signer.toUint8Array());

    const feedResult = await feedWriter.uploadReference(stamp, reference, { index });
    console.debug("Comment feed updated: ", feedResult.reference);

    return userCommentObj;
  } catch (error) {
    console.debug("Error while writing comment: ", error);
    return {} as UserComment;
  }
}

/**
 * Read comments in succession until the latest index of the feed with the given options.
 *
 * @param options The options to use for reading the comment.
 * @throws PrivateKeyError if no privatekey is provided and it cannot be generated from the url.
 * @throws IdentifierError if no identifier is provided and it cannot be generated from the privatekey.
 * @throws StampError if no valid stamp is found.
 *
 * @returns The the array of comment objects that were read from the feed.
 */
export async function readComments(options?: Options): Promise<UserComment[]> {
  const { identifier, beeApiUrl, address: optionsAddress } = await prepareReadOptions(options);

  const bee = new Bee(beeApiUrl);

  const address = optionsAddress || getAddressFromIdentifier(identifier);

  const feedReader = bee.makeFeedReader(new Bytes(identifier).toUint8Array(), address);

  const userComments: UserComment[] = [];

  let nextIndex = 0n;

  while (true) {
    try {
      const feedUpdate = await feedReader.downloadReference({ index: FeedIndex.fromBigInt(nextIndex++) });

      const data = await bee.downloadData(feedUpdate.reference.toUint8Array());

      const comment = data.toJSON();

      if (isUserComment(comment)) {
        userComments.push(comment);
      }
    } catch (_) {
      break;
    }
  }

  return userComments;
}

/**
 * Read nested comments in succession until the latest index of the feed with the given options.
 *
 * @param options The options to use for reading the comment.
 * @throws PrivateKeyError if no privatekey is provided and it cannot be generated from the url.
 * @throws IdentifierError if no identifier is provided and it cannot be generated from the privatekey.
 * @throws StampError if no valid stamp is found.
 *
 * @returns The the array of nested comment objects that were read from the feed.
 */
export async function readCommentsAsTree(options?: Options): Promise<CommentNode[]> {
  const userComments = await readComments(options);

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
 * @throws StampError if no valid stamp is found.
 *
 * @returns The the array of comment objects that were read from the feed.
 */
export async function readCommentsInRange(
  start?: FeedIndex,
  end?: FeedIndex,
  options?: Options,
): Promise<UserComment[]> {
  const { identifier, beeApiUrl, address: optionsAddress } = await prepareReadOptions(options);
  if (start === undefined || end === undefined) {
    console.debug("No start or end index - reading comments synchronously");
    return await readComments(options);
  }

  const bee = new Bee(beeApiUrl);
  const address = optionsAddress || getAddressFromIdentifier(identifier);

  const feedReader = bee.makeFeedReader(new Bytes(identifier).toUint8Array(), address);

  const userComments: UserComment[] = [];

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
          const comment = (result.value as Bytes).toJSON();
          if (isUserComment(comment)) {
            userComments.push(comment);
          }
        } else {
          console.debug("Failed fetching comment data: ", result.reason);
        }
      });
    });
  } catch (err) {
    console.debug(`Error while reading comments from ${start} to ${end}: ${err}`);
    return [] as UserComment[];
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
 * @throws StampError if no valid stamp is found.
 *
 * @returns The the comment object that was read from the feed.
 */
export async function readSingleComment(index?: FeedIndex, options?: Options): Promise<SingleComment | undefined> {
  const { identifier, beeApiUrl, address: optionsAddress } = await prepareReadOptions(options);

  const bee = new Bee(beeApiUrl);
  const address = optionsAddress || getAddressFromIdentifier(identifier);

  const feedReader = bee.makeFeedReader(new Bytes(identifier).toUint8Array(), address);

  let userComment: UserComment;
  let nextIndex: string | undefined = undefined;
  let comment: any;
  try {
    if (index === undefined) {
      const feedUpdate = await feedReader.download();
      const { feedIndexNext, payload } = feedUpdate;
      comment = payload.toJSON();
      nextIndex = feedIndexNext?.toString();
    } else {
      const feedUpdate = await feedReader.downloadReference({ index });
      const data = await bee.downloadData(feedUpdate.reference.toUint8Array());
      comment = data.toJSON();
    }

    if (isUserComment(comment)) {
      userComment = comment;
    } else {
      throw new Error(`Invalid comment format: ${JSON.stringify(comment)}`);
    }
  } catch (error) {
    console.debug("Error while reading single comment: ", error);
    return undefined;
  }

  return { comment: userComment, nextIndex: nextIndex };
}
