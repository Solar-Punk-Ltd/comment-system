import { Topic } from "@ethersphere/bee-js";

import { Reaction } from "../model";

import { getIdentifierFromUrl } from "./url";

/**
 * Generates a reaction feed ID based on the provided target comment feed ID.
 *
 * @param identifier - The ID of the target comment feed for which the reaction feed ID is generated.
 * @default getIdentifierFromUrl(window.location.href)
 *
 * @returns A `Topic` object created from the target comment feed ID.
 */
export const getReactionFeedId = (identifier?: string): Topic => {
  const idSuffix = "reactions";

  if (!identifier) {
    return Topic.fromString(getIdentifierFromUrl(window.location.href + idSuffix));
  }

  return Topic.fromString(identifier + idSuffix);
};

/**
 * Updates the list of reactions based on the provided action.
 *
 * @param reactions - The current list of reactions.
 * @param newReaction - The new reaction to be added, removed, or edited.
 * ### Behavior:
 * - **ADD**: Adds the `newReaction` to the list if it does not already exist.
 * - **REMOVE**: Removes the existing reaction that matches the `newReaction`'s user and reaction type.
 *
 * @returns The updated list of reactions, or `undefined` if no changes were made.
 */
export function updateReactions(reactions: Reaction[], newReaction: Reaction): Reaction[] | undefined {
  const ix = reactions.findIndex(
    r =>
      r.user.address === newReaction.user.address &&
      newReaction.targetMessageId === r.targetMessageId &&
      r.reactionType === newReaction.reactionType,
  );

  if (ix < 0) {
    return [...reactions, newReaction];
  } else {
    const updatedReactions = [...reactions];
    updatedReactions.splice(ix, 1);
    return updatedReactions;
  }
}
