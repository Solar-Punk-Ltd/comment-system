import { Topic } from "@ethersphere/bee-js";

import { Action, Reaction } from "../model";

import { getIdentifierFromUrl } from "./url";
import { ReactionError } from "./errors";

/**
 * Generates a reaction feed ID based on the provided target comment feed ID.
 *
 * @param identifier - The ID of the target comment feed for which the reaction feed ID is generated.
 * @default getIdentifierFromUrl(window.location.href)
 * @throws ReactionError - Throws an error if the `identifier` is empty.
 *
 * @returns A `Topic` object created from the target comment feed ID.
 */
export const getReactionFeedId = (identifier?: string): Topic => {
  const idSuffix = "reactions";

  if (!identifier) {
    return Topic.fromString(getIdentifierFromUrl(window.location.href + idSuffix));
  }

  if (identifier.length === 0) {
    throw new ReactionError("identifier cannot be empty");
  }

  return Topic.fromString(identifier + idSuffix);
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
  // TODO: rework update logic: now the feed is for all the reactions of all comments
  let existingReactionIx = -1;
  let editedReactionIx = -1;
  reactions.forEach((r, ix) => {
    // if (newReaction.targetMessageId !== r.targetMessageId) {
    //   throw new ReactionError(
    //     `Reactions have different targetMessageIds: ${r.targetMessageId} vs ${newReaction.targetMessageId}`,
    //   );
    // }

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
