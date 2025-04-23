import { FeedIndex, PrivateKey, Reference } from "@ethersphere/bee-js";

import { Action, Reaction, readReactions, readReactionsWithIndex, writeReactionsToIndex } from "../src/index";
import { ReactionError } from "../src/utils/errors";
import { getReactionFeedId, updateReactions } from "../src/utils/reactions";

import { createInitMocks } from "./mockHelpers";
import { feedIdentifier, MOCK_STAMP, mockReactions, testIdentity, user1 } from "./utils";

// TODO: integration tests for reactions + comments
describe("Reactions read tests", () => {
  beforeEach(async () => {
    jest.resetAllMocks();
  });

  describe("Serial read", () => {
    it("should read a reaction from a feed", async () => {
      createInitMocks();
      const newIndex = FeedIndex.fromBigInt(BigInt(mockReactions.length));
      const newReactions = await writeReactionsToIndex(mockReactions, newIndex, {
        stamp: MOCK_STAMP,
        identifier: feedIdentifier,
        signer: new PrivateKey(testIdentity.privateKey),
        address: testIdentity.address,
      });
      expect(newReactions).toBeDefined();
      expect(newReactions![0]).toStrictEqual(mockReactions[0]);

      const commentFeedId = getReactionFeedId(feedIdentifier, mockReactions[0].targetMessageId);
      const reactions = await readReactionsWithIndex(newIndex, {
        identifier: commentFeedId,
        address: testIdentity.address,
      });
      expect(reactions).toBeDefined();
      expect(reactions).toStrictEqual(mockReactions);
      expect(reactions!.nextIndex).toBeDefined();
      expect(reactions?.nextIndex).toStrictEqual(FeedIndex.fromBigInt(newIndex.toBigInt() + 1n));
    });
  });
});

describe("getReactionFeedId", () => {
  it("should get the correct reaction feed ID", () => {
    const feedId = getReactionFeedId(feedIdentifier, "00");
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
