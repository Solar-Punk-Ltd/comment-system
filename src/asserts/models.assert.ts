import { Types } from "cafe-utility";

import { Comment, UserComment } from "../model/comment.model";
import { Reaction } from "../model/reaction.model";
import { User } from "../model/user.model";

export function isUser(obj: unknown): obj is User {
  const user = (obj || {}) as User;
  const isValidAddress = user.address ? Types.isString(user.address) : true;

  return Boolean(Types.isStrictlyObject(user) && Types.isString(user.username) && isValidAddress);
}

export function isComment(obj: unknown): obj is Comment {
  const { text, parent, threadId, messageId, flagged, reason } = (obj || {}) as Comment;
  const isValidParent = parent ? Types.isString(parent) : true;
  const isValidThreadId = threadId ? Types.isString(threadId) : true;
  const isValidMessageId = messageId ? Types.isString(messageId) : true;
  const isValidFlagged = flagged ? Types.isBoolean(flagged) : true;
  const isValidReason = reason ? Types.isString(reason) : true;
  const isValidText = Types.isString(text);

  return Boolean(
    isValidFlagged && isValidReason && isValidText && isValidParent && isValidThreadId && isValidMessageId,
  );
}

export function isUserComment(obj: unknown): obj is UserComment {
  const { user, message, timestamp } = (obj || {}) as UserComment;

  return Boolean(isUser(user) && isComment(message) && Types.isNumber(timestamp));
}

export function isReaction(obj: unknown): obj is Reaction {
  const { user, reactionId, reactionType, timestamp, targetMessageId } = (obj || {}) as Reaction;
  const isValidReactionId = reactionId ? Types.isString(reactionId) : true;

  return Boolean(
    isUser(user) &&
      Types.isString(targetMessageId) &&
      Types.isString(reactionType) &&
      Types.isNumber(timestamp) &&
      isValidReactionId,
  );
}

export function isReactionArray(obj: unknown): obj is Reaction[] {
  return Boolean(Array.isArray(obj) && obj.every(r => isReaction(r)));
}
