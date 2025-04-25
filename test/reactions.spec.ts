import { Bee, Bytes, EthAddress, FeedIndex, PrivateKey, Reference, Topic, UploadResult } from "@ethersphere/bee-js";
import { Optional } from "cafe-utility";

import { Action, Reaction, readReactionsWithIndex, writeReactionsToIndex } from "../src/index";
import { ReactionError } from "../src/utils/errors";
import { getReactionFeedId, updateReactions } from "../src/utils/reactions";
import { FeedPayloadResult, FeedReferenceResult } from "../src/utils/types";

import { createInitMocks } from "./mockHelpers";
import { feedIdentifier, MOCK_STAMP, mockReactions, SWARM_ZERO_ADDRESS, testIdentity, user1 } from "./utils";

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
    await writeReactionsToIndex(mockReactions, newIndex, {
      stamp: MOCK_STAMP,
      identifier: feedIdentifier,
      signer: new PrivateKey(testIdentity.privateKey),
      address: testIdentity.address,
    });
    const reactionFeedId = getReactionFeedId(feedIdentifier, mockReactions[0].targetMessageId);

    expect(uploadDataSpy).toHaveBeenCalledWith(MOCK_STAMP, JSON.stringify(mockReactions));
    expect(makeFeedWriterSpy).toHaveBeenCalledWith(
      reactionFeedId.toUint8Array(),
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

    await writeReactionsToIndex(mockReactions, undefined, {
      stamp: MOCK_STAMP,
      identifier: feedIdentifier,
      signer: new PrivateKey(testIdentity.privateKey),
      address: testIdentity.address,
    });
    const reactionFeedId = getReactionFeedId(feedIdentifier, mockReactions[0].targetMessageId);

    expect(uploadDataSpy).toHaveBeenCalledWith(MOCK_STAMP, JSON.stringify(mockReactions));
    expect(makeFeedWriterSpy).toHaveBeenCalledWith(
      reactionFeedId.toUint8Array(),
      new PrivateKey(testIdentity.privateKey).toUint8Array(),
    );
    expect(uploadReferenceSpy).toHaveBeenCalledWith(MOCK_STAMP, mockRef.toUint8Array(), undefined);
  });

  it("should return if reactions array is empty", async () => {
    const logSpy = jest.spyOn(console, "debug");
    const uploadDataSpy = jest.spyOn(Bee.prototype, "uploadData");
    const newIndex = FeedIndex.fromBigInt(5n);
    await writeReactionsToIndex([], newIndex, {
      stamp: MOCK_STAMP,
      identifier: feedIdentifier,
      signer: new PrivateKey(testIdentity.privateKey),
      address: testIdentity.address,
    });
    expect(uploadDataSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith("No reactions to write");
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
    const reactionFeedId = getReactionFeedId(feedIdentifier, mockReactions[0].targetMessageId);
    const reactions = await readReactionsWithIndex(newIndex, {
      identifier: reactionFeedId.toString(),
      address: testIdentity.address,
    });
    expect(reactions).toBeDefined();
    expect(reactions?.reactions).toStrictEqual(mockReactions);
    expect(reactions?.nextIndex).toStrictEqual(FeedIndex.fromBigInt(newIndex.toBigInt() + 1n).toString());

    expect(downloadReferenceSpy).toHaveBeenCalledWith({ index: newIndex });
    expect(makeFeedReaderSpy).toHaveBeenCalledWith(reactionFeedId.toString(), testIdentity.address);
    expect(downloadDataSpy).toHaveBeenCalledWith(mockRef.toUint8Array());
  });

  it("should read a reactions array from a specified feed with an undefined index", async () => {
    const nextIndex = FeedIndex.fromBigInt(5n);
    const downloadSpy = jest.fn().mockResolvedValue({
      payload: Bytes.fromUtf8(JSON.stringify(mockReactions)),
      feedIndex: FeedIndex.fromBigInt(5n),
      feedIndexNext: nextIndex,
    } as FeedPayloadResult);

    const makeFeedReaderSpy = jest.spyOn(Bee.prototype, "makeFeedReader").mockReturnValue({
      download: downloadSpy,
      downloadReference: jest.fn(),
      downloadPayload: jest.fn(),
      owner: new EthAddress("1".repeat(40)),
      topic: Topic.fromString("default-topic"),
    });

    const reactionFeedId = getReactionFeedId(feedIdentifier, mockReactions[0].targetMessageId);
    const reactions = await readReactionsWithIndex(undefined, {
      identifier: reactionFeedId.toString(),
      address: testIdentity.address,
    });
    expect(reactions).toBeDefined();
    expect(reactions?.reactions).toStrictEqual(mockReactions);
    expect(reactions?.nextIndex).toStrictEqual(nextIndex.toString());

    expect(makeFeedReaderSpy).toHaveBeenCalledWith(reactionFeedId.toString(), testIdentity.address);
    expect(downloadSpy).toHaveBeenCalled();
  });
});

describe("getReactionFeedId", () => {
  it("should get the correct reaction feed ID", () => {
    const feedId = getReactionFeedId(feedIdentifier, "00").toString();
    expect(feedId).toBeDefined();
    expect(feedId).toHaveLength(64);
    expect(feedId).toStrictEqual("c5d2f91c27f8d044b7f67a4e25b53225833942f597230bd20c7af8af4c81b1cb");
  });

  it("should throw an error if targetMessageId is empty", () => {
    expect(() => getReactionFeedId(feedIdentifier, "")).toThrow(new ReactionError("targetMessageId cannot be empty"));
  });
});

describe("updateReactions", () => {
  it("should throw an error if targetMessageId does not match", () => {
    const newReaction: Reaction = {
      user: { username: "Random", address: "1234".repeat(10) },
      reactionType: "like",
      targetMessageId: "011",
      reactionId: "2",
      timestamp: 2,
    };

    expect(() => updateReactions(mockReactions, newReaction, Action.ADD)).toThrow(
      new ReactionError(
        `Reactions have different targetMessageIds: ${mockReactions[0].targetMessageId} vs ${newReaction.targetMessageId}`,
      ),
    );
  });

  it("should ADD an existing reaction from a new user", () => {
    const newReaction: Reaction = {
      user: { username: "Random", address: "1234".repeat(10) },
      reactionType: "like",
      targetMessageId: "00",
      reactionId: "2",
      timestamp: 2,
    };

    const updated = updateReactions(mockReactions, newReaction, Action.ADD);
    expect(updated).toHaveLength(mockReactions.length + 1);
    expect(updated).toContainEqual(newReaction);
    expect(updated).toStrictEqual([...mockReactions, newReaction]);
  });

  it("should not ADD a duplicate reaction from the same user", () => {
    const newReaction: Reaction = {
      user: user1,
      reactionType: "like",
      targetMessageId: "00",
      reactionId: "2",
      timestamp: 2,
    };

    const updated = updateReactions(mockReactions, newReaction, Action.ADD);
    expect(updated).toBeUndefined();
  });

  it("should ADD a different reaction from the same user", () => {
    const newReaction: Reaction = {
      user: user1,
      reactionType: "banana",
      targetMessageId: "00",
      reactionId: "2",
      timestamp: 2,
    };

    const updated = updateReactions(mockReactions, newReaction, Action.ADD);
    expect(updated).toHaveLength(mockReactions.length + 1);
    expect(updated).toContainEqual(newReaction);
    expect(updated).toStrictEqual([...mockReactions, newReaction]);
  });

  it("should not REMOVE a non-existing reaction from the same user", () => {
    const newReaction: Reaction = {
      user: user1,
      reactionType: "banana",
      targetMessageId: "00",
      reactionId: "2",
      timestamp: 2,
    };

    const updated = updateReactions(mockReactions, newReaction, Action.REMOVE);
    expect(updated).toBeUndefined();
  });

  it("should not REMOVE an existing reaction from a different user", () => {
    const newReaction: Reaction = {
      user: user1,
      reactionType: "dislike",
      targetMessageId: "00",
      reactionId: "2",
      timestamp: 2,
    };

    const updated = updateReactions(mockReactions, newReaction, Action.REMOVE);
    expect(updated).toBeUndefined();
  });

  it("should REMOVE an existing reaction from the same user", () => {
    const newReaction: Reaction = {
      user: user1,
      reactionType: "like",
      targetMessageId: "00",
      reactionId: "2",
      timestamp: 2,
    };

    const updated = updateReactions(mockReactions, newReaction, Action.REMOVE);
    expect(updated).toHaveLength(mockReactions.length - 1);
    expect(updated).toContainEqual(mockReactions[1]);
    expect(updated).not.toContainEqual(mockReactions[0]);
    expect(updated).toStrictEqual([mockReactions[1]]);
  });

  it("should EDIT and existing reaction from the same user", () => {
    const newReaction: Reaction = { ...mockReactions[0], reactionType: "banana", timestamp: 2 };

    const updated = updateReactions(mockReactions, newReaction, Action.EDIT);
    expect(updated).toHaveLength(mockReactions.length);
    expect(updated).toContainEqual(mockReactions[1]);
    expect(updated).toContainEqual(newReaction);
    expect(updated).not.toContainEqual(mockReactions[0]);
    expect(updated).toStrictEqual([mockReactions[1], newReaction]);
  });

  it("should not EDIT a non-existing reaction from the same user", () => {
    const newReaction: Reaction = { ...mockReactions[0], reactionId: "infinite" };

    const updated = updateReactions(mockReactions, newReaction, Action.EDIT);
    expect(updated).toBeUndefined();
  });

  it("should not EDIT an existing reaction from a different user", () => {
    const newReaction: Reaction = { ...mockReactions[0], reactionId: mockReactions[1].reactionId };

    const updated = updateReactions(mockReactions, newReaction, Action.EDIT);
    expect(updated).toBeUndefined();
  });

  it("should not create duplicates with EDIT by editing an existing reaction of the same user", () => {
    const newId = "2";
    mockReactions.push({ ...mockReactions[0], reactionType: "banana", reactionId: newId });
    const newReaction: Reaction = { ...mockReactions[0], reactionId: newId };

    const updated = updateReactions(mockReactions, newReaction, Action.EDIT);
    expect(updated).toBeUndefined();
  });
});
