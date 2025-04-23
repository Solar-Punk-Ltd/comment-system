import {
  Bee,
  Bytes,
  EthAddress,
  FeedIndex,
  FeedReader,
  FeedWriter,
  Reference,
  Topic,
  UploadResult,
} from "@ethersphere/bee-js";
import { Optional } from "cafe-utility";

import { FeedPayloadResult } from "../src/utils/types";

import { SWARM_ZERO_ADDRESS } from "./utils";

export function createMockGetFeedDataResult(currentIndex = 0, nextIndex = 1, data = "dummy"): FeedPayloadResult {
  return {
    feedIndex: FeedIndex.fromBigInt(BigInt(currentIndex)),
    feedIndexNext: FeedIndex.fromBigInt(BigInt(nextIndex)),
    payload: Bytes.fromUtf8(data),
  };
}

export function createMockFeedReader(char: string = "1"): FeedReader {
  return {
    owner: new EthAddress(char.repeat(40)),
    download: jest.fn().mockRejectedValue({ payload: new Bytes(char.repeat(64)) }),
    downloadReference: jest.fn().mockRejectedValue({ reference: new Reference(char.repeat(64)) }),
    downloadPayload: jest.fn().mockResolvedValue({ payload: new Bytes(char.repeat(64)) }),
    topic: Topic.fromString(char),
  };
}

export function createMockFeedWriter(char: string = "1"): FeedWriter {
  return {
    upload: jest.fn().mockResolvedValue({
      reference: new Reference(char.repeat(64)),
      historyAddress: Optional.of(SWARM_ZERO_ADDRESS),
    } as UploadResult),
    uploadReference: jest.fn().mockResolvedValue({
      reference: new Reference(char.repeat(64)),
      historyAddress: Optional.of(SWARM_ZERO_ADDRESS),
    } as UploadResult),
    uploadPayload: jest.fn().mockResolvedValue({
      reference: new Reference(char.repeat(64)),
      historyAddress: Optional.of(SWARM_ZERO_ADDRESS),
    } as UploadResult),
    ...createMockFeedReader(char),
  };
}

export function createInitMocks(data?: Reference): any {
  jest.spyOn(Bee.prototype, "downloadData").mockResolvedValue(new Bytes(data || SWARM_ZERO_ADDRESS));
  jest.spyOn(Bee.prototype, "uploadData").mockResolvedValue({
    reference: data || SWARM_ZERO_ADDRESS,
    historyAddress: Optional.of(data || SWARM_ZERO_ADDRESS),
  } as unknown as UploadResult);
  jest.spyOn(Bee.prototype, "makeFeedWriter").mockReturnValue(createMockFeedWriter());
  jest.spyOn(Bee.prototype, "makeFeedReader").mockReturnValue(createMockFeedReader());
}

// export function createUploadDataSpy(char: string): jest.SpyInstance {
//   return jest.spyOn(Bee.prototype, "uploadData").mockResolvedValueOnce({
//     reference: new Reference(char.repeat(64)),
//     historyAddress: Optional.of(SWARM_ZERO_ADDRESS),
//   });
// }
