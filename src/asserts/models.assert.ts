import { Comment, User, UserComment } from "../model/comment.model";
import { Action, Reaction } from "../model/reaction.model";

import { isBoolean, isNumber, isStrictlyObject, isString } from "./general.assert";

export function isUser(obj: unknown): obj is User {
  const user = (obj || {}) as User;
  const isValidAddress = user.address ? isString(user.address) : true;

  return Boolean(isStrictlyObject(user) && isString(user.username) && isValidAddress);
}

export function isComment(obj: unknown): obj is Comment {
  const { text, parent, threadId, messageId, flagged, reason } = (obj || {}) as Comment;
  const isValidParent = parent ? isString(parent) : true;
  const isValidThreadId = threadId ? isString(threadId) : true;
  const isValidMessageId = messageId ? isString(messageId) : true;
  const isValidFlagged = flagged ? isBoolean(flagged) : true;
  const isValidReason = reason ? isString(reason) : true;
  const isValidText = isString(text);

  return Boolean(
    isValidFlagged && isValidReason && isValidText && isValidParent && isValidThreadId && isValidMessageId,
  );
}

export function isUserComment(obj: unknown): obj is UserComment {
  const { user, message, timestamp } = (obj || {}) as UserComment;

  return Boolean(isUser(user) && isComment(message) && isNumber(timestamp));
}

export function isReaction(obj: unknown): obj is Reaction {
  const { user, reactionId, action, reactionType, timestamp, targetMessageId } = (obj || {}) as Reaction;
  const isValidReactionId = reactionId ? isString(reactionId) : true;
  const isValidAction = Object.values(Action).includes(action);

  return Boolean(
    isUser(user) &&
      isString(targetMessageId) &&
      isString(reactionType) &&
      isNumber(timestamp) &&
      isValidReactionId &&
      isValidAction,
  );
}

export function isReactionArray(obj: unknown): obj is Reaction[] {
  return Boolean(Array.isArray(obj) && obj.every(r => isReaction(r)));
}
