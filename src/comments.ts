import { Bee, Bytes, FeedIndex, UploadResult } from "@ethersphere/bee-js";
import { Types } from "cafe-utility";
import { v4 as uuidv4 } from "uuid";

import { CommentNode, MessageData } from "./model/comment.model";
import { Options } from "./model/options.model";
import {
  assertAndTransformData,
  isNotFoundError,
  prepareReadOptions,
  prepareWriteOptions,
  readFeedData,
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
 * @returns An UploadResult object returned by the feed update or undefined in case of failure.
 */
export async function writeComment(comment: MessageData, options?: Options): Promise<UploadResult | undefined> {
  const { identifier, stamp, beeApiUrl, signer: optionsSigner } = await prepareWriteOptions(options);

  const signer = optionsSigner || getPrivateKeyFromIdentifier(identifier);

  const bee = new Bee(beeApiUrl);

  const userCommentObj: MessageData = {
    ...comment,
    id: comment.id || uuidv4(),
    timestamp: Types.isNumber(comment.timestamp) ? comment.timestamp : new Date().getTime(),
  };

  try {
    return await writeFeedData(
      bee,
      new Bytes(identifier).toUint8Array(),
      stamp,
      signer.toUint8Array(),
      JSON.stringify(userCommentObj),
    );
  } catch (err: any) {
    console.error("Error while writing comment to the latest index: ", err.message || err);
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
 * @returns An UploadResult object returned by the feed update or undefined in case of failure.
 */
export async function writeCommentToIndex(
  comment: MessageData,
  index?: FeedIndex,
  options?: Options,
): Promise<UploadResult | undefined> {
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
    return await writeFeedData(
      bee,
      new Bytes(identifier).toUint8Array(),
      stamp,
      signer.toUint8Array(),
      JSON.stringify(userCommentObj),
      index,
    );
  } catch (err: any) {
    console.error(`Error while writing comment to index ${index.toString()}: ${err.message || err}`);
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
      const { data } = await readFeedData(
        bee,
        new Bytes(identifier).toUint8Array(),
        address,
        FeedIndex.fromBigInt(nextIndex++),
      );

      const transformed = assertAndTransformData(
        data,
        address.toString(),
        FeedIndex.fromBigInt(nextIndex - 1n),
        identifier,
      );

      userComments.push(transformed);
    } catch (err: any) {
      if (!isNotFoundError(err)) {
        console.error(`Error while reading comments at index ${(nextIndex - 1n).toString()}:`, err.message || err);
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
  const feedUpdatePromises: Promise<{ result: FeedReferenceResult; ix: bigint }>[] = [];

  for (let i = actualStart; i <= end.toBigInt(); i++) {
    feedUpdatePromises.push(
      feedReader.downloadReference({ index: FeedIndex.fromBigInt(i) }).then(result => ({ result, ix: i })),
    );
  }

  const dataPromises: Promise<{ data: Bytes; ix: bigint }>[] = [];

  feedUpdatePromises.forEach(async feedPromise => {
    try {
      const feedResult = await feedPromise;
      dataPromises.push(
        bee.downloadData(feedResult.result.reference.toUint8Array()).then(data => ({ data, ix: feedResult.ix })),
      );
    } catch (error) {
      if (!isNotFoundError(error)) {
        console.error(`Error while fetching feed update: ${error}`);
        return;
      }
      console.debug("Feed update not found: ", error);
    }
  });

  await Promise.allSettled(feedUpdatePromises);

  const dataResults = await Promise.allSettled(dataPromises);
  for (const r of dataResults) {
    if (r.status === "fulfilled") {
      const transformed = assertAndTransformData(
        (r.value.data as Bytes).toJSON(),
        address.toString(),
        FeedIndex.fromBigInt(r.value.ix),
        identifier,
      );

      userComments.push(transformed);
    } else {
      if (!isNotFoundError(r.reason)) {
        console.error(`Error while fetching comment data: ${r.reason}`);
        return;
      }
      console.debug("Comment not found: ", r.reason);
      break;
    }
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
export async function readSingleComment(index?: FeedIndex, options?: Options): Promise<MessageData | undefined> {
  const { identifier, beeApiUrl, address: optionsAddress } = await prepareReadOptions(options);

  const bee = new Bee(beeApiUrl);
  const address = optionsAddress || getAddressFromIdentifier(identifier);

  let comment: MessageData | undefined;
  try {
    const { data, nextIndex } = await readFeedData(bee, new Bytes(identifier).toUint8Array(), address, index);

    comment = assertAndTransformData(data, address.toString(), FeedIndex.fromBigInt(nextIndex - 1n), identifier);
  } catch (err: any) {
    if (!isNotFoundError(err)) {
      console.error(
        `Error while reading single comment at index ${index?.toString() || "latest"}: ${err.message || err}`,
      );
    }

    console.debug(`No comment found at index ${index?.toString() || "latest"}`);
  }

  return comment;
}
