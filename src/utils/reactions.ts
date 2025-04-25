import { Topic } from "@ethersphere/bee-js";

import { Action, Reaction } from "../model";

import { ReactionError } from "./errors";

export const getReactionFeedId = (targetMessageId: string): Topic => {
  if (targetMessageId.length === 0) {
    throw new ReactionError("targetMessageId cannot be empty");
  }

  return Topic.fromString(targetMessageId);
};

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
