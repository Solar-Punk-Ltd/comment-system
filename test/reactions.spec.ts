import { Bee, Bytes, EthAddress, FeedIndex, PrivateKey, Reference, Topic, UploadResult } from "@ethersphere/bee-js";
import { Optional } from "cafe-utility";

import { MessageData, readReactionsWithIndex, writeReactionsToIndex } from "../src/index";
import { MessageType } from "../src/model/comment.model";
import { ReactionError } from "../src/utils/errors";
import { getReactionFeedId, getReactionFeedIdForComment, updateReactions } from "../src/utils/reactions";
import { FeedReferenceResult } from "../src/utils/types";

import { createInitMocks } from "./mockHelpers";
import { MOCK_STAMP, mockReactions, SWARM_ZERO_ADDRESS, testIdentity, user1 } from "./utils";

describe("Reactions tests", () => {
  describe("writeReactionsToIndex", () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it("should write a reactions array to a specified feed with a specified index", async () => {
      const mockRef = new Reference("1".repeat(64));
      createInitMocks(mockRef);

      const uploadDataSpy = jest.spyOn(Bee.prototype, "uploadData");

      const uploadReferenceSpy = jest.fn().mockResolvedValue(
        jest.fn().mockResolvedValue({
          reference: mockRef,
          historyAddress: Optional.of(SWARM_ZERO_ADDRESS),
        } as UploadResult),
      );

      const makeFeedWriterSpy = jest.spyOn(Bee.prototype, "makeFeedWriter").mockReturnValue({
        uploadReference: uploadReferenceSpy,
        upload: jest.fn(),
        uploadPayload: jest.fn(),
        download: jest.fn(),
        downloadReference: jest.fn(),
        downloadPayload: jest.fn(),
        owner: new EthAddress("1".repeat(40)),
        topic: Topic.fromString("default-topic"),
      });

      const newIndex = FeedIndex.fromBigInt(5n);
      const reactionFeedId = getReactionFeedId(mockReactions[0].targetMessageId).toString();
      await writeReactionsToIndex(mockReactions, newIndex, {
        stamp: MOCK_STAMP,
        identifier: reactionFeedId,
        signer: new PrivateKey(testIdentity.privateKey),
        address: testIdentity.address,
      });

      expect(uploadDataSpy).toHaveBeenCalledWith(MOCK_STAMP, JSON.stringify(mockReactions));
      expect(makeFeedWriterSpy).toHaveBeenCalledWith(
        reactionFeedId,
        new PrivateKey(testIdentity.privateKey).toUint8Array(),
      );
      expect(uploadReferenceSpy).toHaveBeenCalledWith(MOCK_STAMP, mockRef.toUint8Array(), { index: newIndex });
    });

    it("should write a reactions array to a specified feed with an undefined index", async () => {
      const mockRef = new Reference("1".repeat(64));
      createInitMocks(mockRef);

      const uploadDataSpy = jest.spyOn(Bee.prototype, "uploadData");

      const uploadReferenceSpy = jest.fn().mockResolvedValue(
        jest.fn().mockResolvedValue({
          reference: mockRef,
          historyAddress: Optional.of(SWARM_ZERO_ADDRESS),
        } as UploadResult),
      );

      const makeFeedWriterSpy = jest.spyOn(Bee.prototype, "makeFeedWriter").mockReturnValue({
        uploadReference: uploadReferenceSpy,
        upload: jest.fn(),
        uploadPayload: jest.fn(),
        download: jest.fn(),
        downloadReference: jest.fn(),
        downloadPayload: jest.fn(),
        owner: new EthAddress("1".repeat(40)),
        topic: Topic.fromString("default-topic"),
      });

      const reactionFeedId = getReactionFeedId(mockReactions[0].targetMessageId).toString();
      await writeReactionsToIndex(mockReactions, undefined, {
        stamp: MOCK_STAMP,
        identifier: reactionFeedId,
        signer: new PrivateKey(testIdentity.privateKey),
        address: testIdentity.address,
      });

      expect(uploadDataSpy).toHaveBeenCalledWith(MOCK_STAMP, JSON.stringify(mockReactions));
      expect(makeFeedWriterSpy).toHaveBeenCalledWith(
        reactionFeedId,
        new PrivateKey(testIdentity.privateKey).toUint8Array(),
      );
      expect(uploadReferenceSpy).toHaveBeenCalledWith(MOCK_STAMP, mockRef.toUint8Array(), undefined);
    });

    it("should be able to write an empty array", async () => {
      const mockRef = new Reference("1".repeat(64));
      createInitMocks(mockRef);

      const uploadDataSpy = jest.spyOn(Bee.prototype, "uploadData");

      const uploadReferenceSpy = jest.fn().mockResolvedValue(
        jest.fn().mockResolvedValue({
          reference: mockRef,
          historyAddress: Optional.of(SWARM_ZERO_ADDRESS),
        } as UploadResult),
      );

      const makeFeedWriterSpy = jest.spyOn(Bee.prototype, "makeFeedWriter").mockReturnValue({
        uploadReference: uploadReferenceSpy,
        upload: jest.fn(),
        uploadPayload: jest.fn(),
        download: jest.fn(),
        downloadReference: jest.fn(),
        downloadPayload: jest.fn(),
        owner: new EthAddress("1".repeat(40)),
        topic: Topic.fromString("default-topic"),
      });

      const reactionFeedId = getReactionFeedId(mockReactions[0].targetMessageId).toString();
      await writeReactionsToIndex([], undefined, {
        stamp: MOCK_STAMP,
        identifier: reactionFeedId,
        signer: new PrivateKey(testIdentity.privateKey),
        address: testIdentity.address,
      });

      expect(uploadDataSpy).toHaveBeenCalledWith(MOCK_STAMP, JSON.stringify([]));
      expect(makeFeedWriterSpy).toHaveBeenCalledWith(
        reactionFeedId,
        new PrivateKey(testIdentity.privateKey).toUint8Array(),
      );
      expect(uploadReferenceSpy).toHaveBeenCalledWith(MOCK_STAMP, mockRef.toUint8Array(), undefined);
    });
  });

  describe("readReactionsWithIndex", () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it("should read a reactions array from a specified feed with a specified index", async () => {
      const mockRef = new Reference("1".repeat(64));
      const downloadDataSpy = jest
        .spyOn(Bee.prototype, "downloadData")
        .mockResolvedValue(Bytes.fromUtf8(JSON.stringify(mockReactions)));

      const downloadReferenceSpy = jest.fn().mockResolvedValue({
        reference: mockRef,
        feedIndex: FeedIndex.fromBigInt(5n),
        feedIndexNext: undefined,
      } as FeedReferenceResult);

      const makeFeedReaderSpy = jest.spyOn(Bee.prototype, "makeFeedReader").mockReturnValue({
        download: jest.fn(),
        downloadReference: downloadReferenceSpy,
        downloadPayload: jest.fn(),
        owner: new EthAddress("1".repeat(40)),
        topic: Topic.fromString("default-topic"),
      });

      const newIndex = FeedIndex.fromBigInt(5n);
      const reactionFeedId = getReactionFeedId(mockReactions[0].targetMessageId).toString();
      const reactions = await readReactionsWithIndex(newIndex, {
        identifier: reactionFeedId,
        address: testIdentity.address,
      });
      expect(reactions).toBeDefined();
      expect(reactions?.messages).toStrictEqual(mockReactions);
      expect(reactions?.nextIndex).toStrictEqual(newIndex.next().toString());

      expect(downloadReferenceSpy).toHaveBeenCalledWith({ index: newIndex });
      expect(makeFeedReaderSpy).toHaveBeenCalledWith(reactionFeedId, testIdentity.address);
      expect(downloadDataSpy).toHaveBeenCalledWith(mockRef.toUint8Array());
    });

    it("should read a reactions array from a specified feed with an undefined index", async () => {
      const nextIndex = FeedIndex.fromBigInt(6n);
      const mockRef = new Reference("1".repeat(64));
      const downloadReferenceSpy = jest.fn().mockResolvedValue({
        reference: mockRef,
        feedIndex: FeedIndex.fromBigInt(5n),
        feedIndexNext: nextIndex,
      } as FeedReferenceResult);

      const downloadDataSpy = jest
        .spyOn(Bee.prototype, "downloadData")
        .mockResolvedValue(Bytes.fromUtf8(JSON.stringify(mockReactions)));

      const makeFeedReaderSpy = jest.spyOn(Bee.prototype, "makeFeedReader").mockReturnValue({
        download: jest.fn(),
        downloadReference: downloadReferenceSpy,
        downloadPayload: jest.fn(),
        owner: new EthAddress("1".repeat(40)),
        topic: Topic.fromString("default-topic"),
      });

      const reactionFeedId = getReactionFeedId(mockReactions[0].targetMessageId).toString();
      const reactions = await readReactionsWithIndex(undefined, {
        identifier: reactionFeedId,
        address: testIdentity.address,
      });

      expect(reactions).toBeDefined();
      expect(reactions?.messages).toStrictEqual(mockReactions);
      expect(reactions?.nextIndex).toStrictEqual(nextIndex.toString());

      expect(makeFeedReaderSpy).toHaveBeenCalledWith(reactionFeedId, testIdentity.address);
      expect(downloadReferenceSpy).toHaveBeenCalled();
      expect(downloadDataSpy).toHaveBeenCalledWith(mockRef.toUint8Array());
    });
  });

  describe("getReactionFeedId", () => {
    it("should get the correct reaction feed ID", () => {
      const feedId = getReactionFeedId("00").toString();
      expect(feedId).toBeDefined();
      expect(feedId).toHaveLength(64);
      expect(feedId).toStrictEqual("aec8cdc0f4ef3ea23e10e2d8229e443283123122b0e0c2329d558d5689c117c1");
    });

    it("should throw an error if the identifier is empty and the window context is not available", () => {
      expect(() => getReactionFeedId("")).toThrow(ReactionError);
    });

    it("should use the default 'window.location.href + idSuffix' if the identifier is empty", () => {
      if (typeof globalThis.window === "undefined") {
        // @ts-expect-error globalThis.window is not defined in Node.js
        globalThis.window = { location: { href: "http://example.com" } };
      }

      const feedId = getReactionFeedId("").toString();
      expect(feedId).toBeDefined();
      expect(feedId).toHaveLength(64);
      expect(feedId).toStrictEqual("7bd83c4a7165f908e18e34f5637dcd754f3015bca5b71491b358cecf4c7372ed");
    });

    it("should use the default 'window.location.href + idSuffix' if the identifier is undefined", () => {
      const feedId = getReactionFeedId(undefined).toString();
      expect(feedId).toBeDefined();
      expect(feedId).toHaveLength(64);
      expect(feedId).toStrictEqual("7bd83c4a7165f908e18e34f5637dcd754f3015bca5b71491b358cecf4c7372ed");
    });
  });

  describe("getReactionFeedIdForComment", () => {
    it("should get the correct reaction feed ID", () => {
      const feedId = getReactionFeedIdForComment("00").toString();
      expect(feedId).toBeDefined();
      expect(feedId).toHaveLength(64);
      expect(feedId).toStrictEqual("e3f0ae350ee09657933cd8202a4dd563c5af941f8054e6d7191e3246be378290");
    });

    it("should throw an error if targetMessageId is empty", () => {
      expect(() => getReactionFeedIdForComment("")).toThrow(new ReactionError("targetMessageId cannot be empty"));
    });
  });

  describe("updateReactions", () => {
    it("should ADD a new reaction from a new user", () => {
      const newReaction: MessageData = {
        username: "Random",
        address: "1234".repeat(10),
        message: "like",
        targetMessageId: "00",
        id: "2",
        timestamp: 2,
        type: MessageType.REACTION,
        index: 2n.toString(),
        topic: "chat1",
      };

      const updated = updateReactions(mockReactions, newReaction);
      expect(updated).toHaveLength(mockReactions.length + 1);
      expect(updated).toContainEqual(newReaction);
      expect(updated).toStrictEqual([...mockReactions, newReaction]);
    });

    it("should ADD a different reaction from the same user", () => {
      const newReaction: MessageData = {
        username: user1.username,
        address: user1.address,
        message: "banana",
        targetMessageId: "00",
        id: "2",
        timestamp: 2,
        type: MessageType.REACTION,
        index: 2n.toString(),
        topic: "chat1",
      };

      const updated = updateReactions(mockReactions, newReaction);
      expect(updated).toHaveLength(mockReactions.length + 1);
      expect(updated).toContainEqual(newReaction);
      expect(updated).toStrictEqual([...mockReactions, newReaction]);
    });

    it("should REMOVE an existing reaction from the same user", () => {
      const updated = updateReactions(mockReactions, mockReactions[0]);
      expect(updated).toHaveLength(mockReactions.length - 1);
      expect(updated).toContainEqual(mockReactions[1]);
      expect(updated).not.toContainEqual(mockReactions[0]);
      expect(updated).toStrictEqual([mockReactions[1]]);
    });
  });
});
