import { Topic } from "@ethersphere/bee-js";

import { Action, Reaction } from "../model";

import { ReactionError } from "./errors";

/**
 * Generates a reaction feed ID based on the provided target message ID.
 *
 * @param targetMessageId - The ID of the target message for which the reaction feed ID is generated.
 * @throws ReactionError - Throws an error if the `targetMessageId` is empty.
 *
 * @returns A `Topic` object created from the target message ID.
 */
export const getReactionFeedId = (targetMessageId: string): Topic => {
  if (targetMessageId.length === 0) {
    throw new ReactionError("targetMessageId cannot be empty");
  }

  return Topic.fromString(targetMessageId);
};

/**
 * Updates the list of reactions based on the provided action.
 *
 * @param reactions - The current list of reactions.
 * @param newReaction - The new reaction to be added, removed, or edited.
 * @param action - The action to perform on the reactions (ADD, REMOVE, or EDIT).
 * ### Action Behavior:
 * - **ADD**: Adds the `newReaction` to the list if it does not already exist.
 * - **REMOVE**: Removes the existing reaction that matches the `newReaction`'s user and reaction type.
 * - **EDIT**: Replaces an existing reaction with the same `reactionId` as the `newReaction`
 *             if no other reaction of the same type exists for the user.
 *
 * @throws {ReactionError} If the `targetMessageId` of the new reaction does not match
 *                         the `targetMessageId` of the existing reactions.
 * @throws {ReactionError} If an invalid action is provided.
 *
 * @returns The updated list of reactions, or `undefined` if no changes were made.
 */
export function updateReactions(reactions: Reaction[], newReaction: Reaction, action: Action): Reaction[] | undefined {
  let existingReactionIx = -1;
  let editedReactionIx = -1;
  reactions.forEach((r, ix) => {
    if (newReaction.targetMessageId !== r.targetMessageId) {
      throw new ReactionError(
        `Reactions have different targetMessageIds: ${r.targetMessageId} vs ${newReaction.targetMessageId}`,
      );
    }

    const isSameUser = r.user.address === newReaction.user.address;
    if (isSameUser && r.reactionType === newReaction.reactionType) {
      existingReactionIx = ix;
    }

    if (isSameUser && r.reactionId === newReaction.reactionId) {
      editedReactionIx = ix;
    }
  });

  const updatedReactions = [...reactions];

  switch (action) {
    case Action.ADD:
      if (existingReactionIx < 0) {
        updatedReactions.push(newReaction);
        return updatedReactions;
      }
      break;
    case Action.REMOVE:
      if (existingReactionIx >= 0) {
        updatedReactions.splice(existingReactionIx, 1);
        return updatedReactions;
      }
      break;
    case Action.EDIT:
      if (editedReactionIx >= 0 && existingReactionIx < 0) {
        updatedReactions.splice(editedReactionIx, 1);
        updatedReactions.push(newReaction);
        return updatedReactions;
      }
      break;
    default:
      throw new ReactionError(`Invalid action: ${action}`);
  }

  return;
}
