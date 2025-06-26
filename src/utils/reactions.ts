import { Topic } from "@ethersphere/bee-js";

import { MessageData } from "../model";

import { getIdentifierFromUrl } from "./url";
import { ReactionError } from "./errors";

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
    if (typeof window === "undefined" || !window?.location?.href) {
      throw new ReactionError("Cannot generate reaction feed ID without an identifier or window context");
    }

    return Topic.fromString(getIdentifierFromUrl(window.location.href + idSuffix));
  }

  return Topic.fromString(identifier + idSuffix);
};

/**
 * Generates a reaction feed ID based on the provided target comment feed ID.
 *
 * @param identifier - The ID of the target comment feed for which the reaction feed ID is generated.
 * @default getIdentifierFromUrl(window.location.href)
 *
 * @returns A `Topic` object created from the target comment feed ID.
 */
export const getReactionFeedIdForComment = (targetMessageId: string): Topic => {
  if (targetMessageId.length === 0) {
    throw new ReactionError("targetMessageId cannot be empty");
  }

  return Topic.fromString(targetMessageId);
};
/**
 * Updates the list of reactions.
 *
 * @param reactions - The current list of reactions.
 * @param newReaction - The new reaction to be added, removed, or edited.
 * ### Behavior:
 * - **ADD**: Adds the `newReaction` to the list if it does not already exist.
 * - **REMOVE**: Removes the existing reaction that matches the `newReaction`'s user and reaction type.
 *
 * @returns The updated list of reactions, or `undefined` if no changes were made.
 */
export function updateReactions(reactions: MessageData[], newReaction: MessageData): MessageData[] | undefined {
  const ix = reactions.findIndex(
    r =>
      r.address === newReaction.address &&
      newReaction.targetMessageId === r.targetMessageId &&
      r.message === newReaction.message,
  );

  if (ix < 0) {
    return [...reactions, newReaction];
  } else {
    const updatedReactions = [...reactions];
    updatedReactions.splice(ix, 1);
    return updatedReactions;
  }
}
