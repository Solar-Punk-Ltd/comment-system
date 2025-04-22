import { Topic } from "@ethersphere/bee-js";
import { Action, Reaction } from "../model";
import { ReactionError } from "./errors";

export const getReactionFeedId = (identifier: string, targetMessageId: string): string => {
  if (targetMessageId.length === 0) {
    throw new ReactionError("targetMessageId cannot be empty");
  }

  return Topic.fromString(identifier.concat(targetMessageId)).toString();
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
    // todo: filter out should not create duplicates with EDIT by editing an existing reaction of the same user
    const isSameUser = r.user.address === newReaction.user.address;
    if (isSameUser && r.reactionType === newReaction.reactionType) {
      existingReactionIx = ix;
    }

    if (isSameUser && r.reactionId === newReaction.reactionId) {
      editedReactionIx = ix;
    }
  });

  const mergedReactions = [...reactions];
  console.log("bagoy existingReactionIx: ", existingReactionIx);

  switch (action) {
    case Action.ADD:
      if (existingReactionIx < 0) {
        mergedReactions.push(newReaction);
        return mergedReactions;
      }
      break;
    case Action.REMOVE:
      if (existingReactionIx >= 0) {
        mergedReactions.splice(existingReactionIx, 1);
        return mergedReactions;
      }
      break;
    case Action.EDIT:
      if (editedReactionIx >= 0) {
        mergedReactions.splice(editedReactionIx, 1);
        mergedReactions.push(newReaction);
        return mergedReactions;
      }
      break;
    default:
      throw new ReactionError(`Invalid action: ${action}`);
  }

  return;
}
