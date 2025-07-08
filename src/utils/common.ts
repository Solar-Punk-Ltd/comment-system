import { BatchId, Bee, EthAddress, FeedIndex, Topic } from "@ethersphere/bee-js";

import { DEFAULT_BEE_URL } from "../constants/constants";
import { Options } from "../model/options.model";
import { Optional } from "../model/util.types";

import { IdentifierError, StampError } from "./errors";
import { getUsableStamp } from "./stamps";
import { getIdentifierFromUrl } from "./url";

async function prepareOptions(
  options: Options = {},
  stampRequired = true,
): Promise<Optional<Required<Options>, "stamp" | "signer" | "address">> {
  const beeApiUrl = options.beeApiUrl ?? DEFAULT_BEE_URL;
  const { signer, address } = options;
  let { identifier, stamp } = options;

  if (!identifier) {
    identifier = getIdentifierFromUrl(window.location.href);
  }

  if (!identifier) {
    throw new IdentifierError("Cannot generate private key from an invalid URL");
  }

  if (!stamp && stampRequired) {
    const usableStamp = await getUsableStamp(beeApiUrl);

    if (!usableStamp) {
      throw new StampError("No available stamps found.");
    }

    stamp = usableStamp.batchID;
  }

  return {
    stamp,
    identifier,
    beeApiUrl,
    signer,
    address,
  };
}

export function prepareWriteOptions(options: Options = {}): Promise<Optional<Required<Options>, "signer">> {
  return prepareOptions(options) as Promise<Optional<Required<Options>, "signer">>;
}

export function prepareReadOptions(
  options: Options = {},
): Promise<Omit<Optional<Required<Options>, "address">, "stamp" | "signer">> {
  return prepareOptions(options, false);
}

export interface FeedData {
  objectdata: any;
  nextIndex: string;
}

export async function readFeedData(
  bee: Bee,
  identifier: string | Uint8Array,
  address: string | EthAddress,
  index?: FeedIndex,
): Promise<FeedData> {
  const feedReader = bee.makeFeedReader(identifier, address);

  const feedUpdate = await feedReader.downloadReference(index ? { index } : undefined);
  const nextIndex =
    feedUpdate.feedIndexNext !== undefined
      ? feedUpdate.feedIndexNext.toString()
      : FeedIndex.fromBigInt(feedUpdate.feedIndex.toBigInt() + 1n).toString();
  const data = await bee.downloadData(feedUpdate.reference.toUint8Array());

  return { objectdata: data.toJSON(), nextIndex };
}

export async function writeFeedData(
  bee: Bee,
  topic: Topic | Uint8Array | string,
  stamp: string | BatchId,
  signer: Uint8Array | string,
  data: string | Uint8Array,
  index?: FeedIndex,
): Promise<void> {
  const { reference } = await bee.uploadData(stamp, data);
  const feedWriter = bee.makeFeedWriter(topic, signer);
  await feedWriter.uploadReference(stamp, reference.toUint8Array(), index === undefined ? undefined : { index });
}

export function isNotFoundError(error: any): boolean {
  return (
    error.stack.includes("404") ||
    error.message.includes("Not Found") ||
    error.message.includes("404") ||
    error.code === 404
  );
}
