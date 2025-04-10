import { FeedIndex, PrivateKey, Reference } from "@ethersphere/bee-js";

import { Action, readReactions, readReactionsWithIndex, writeReactionsToIndex } from "../src/index";

import { createInitMocks } from "./mockHelpers";
import { feedIdentifier, MOCK_STAMP, mockReactions, testIdentity } from "./utils";

// TODO: integration tests for reactions + comments
describe("Reactions read tests", () => {
  beforeEach(async () => {
    jest.resetAllMocks();
  });

  describe("Serial read", () => {
    it("should read a reaction from a feed", async () => {
      createInitMocks();
      const newReaction = {
        user: { username: "Random" },
        reactionType: "like",
        action: Action.ADD,
        targetMessageId: "789",
        reactionId: "2",
        timestamp: 2,
      };
      const newIndex = FeedIndex.fromBigInt(BigInt(mockReactions.length));
      const newReactions = await writeReactionsToIndex(newReaction, mockReactions, newIndex, {
        stamp: MOCK_STAMP,
        identifier: feedIdentifier,
        signer: new PrivateKey(testIdentity.privateKey),
        address: testIdentity.address,
      });
      expect(newReactions).toBeDefined();
      expect(newReactions![0]).toStrictEqual(mockReactions[0]);
      const reactions = await readReactionsWithIndex(newIndex, {
        identifier: feedIdentifier,
        address: testIdentity.address,
      });
      expect(reactions).toStrictEqual(mockReactions);
      expect(reactions!.nextIndex).toBeDefined();
      expect(reactions?.nextIndex).toStrictEqual(FeedIndex.fromBigInt(newIndex.toBigInt() + 1n));
    });
  });
});
