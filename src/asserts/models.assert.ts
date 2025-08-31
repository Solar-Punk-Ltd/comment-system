import { Types } from "cafe-utility";

import { MessageData, MessageType } from "../model/comment.model";
import { Comment, UserComment } from "../model/legacy.model";

export function isMessageData(obj: unknown): obj is MessageData {
  const { id, index, type, topic, message, timestamp, username, address, targetMessageId, flagged, reason, signature } =
    (obj || {}) as MessageData;
  const isValidId = id ? Types.isString(id) : true;
  const isValidSignature = signature ? Types.isString(signature) : true;
  const isValidTargetMessageId = targetMessageId ? Types.isString(targetMessageId) : true;
  const isValidFlagged = flagged ? Types.isBoolean(flagged) : true;
  const isValidReason = reason ? Types.isString(reason) : true;

  return Boolean(
    Types.isString(message) &&
      Types.isNumber(timestamp) &&
      Types.isString(username) &&
      Types.isString(address) &&
      Types.isString(index) &&
      Types.isString(type) &&
      Types.isString(topic) &&
      isValidId &&
      isValidTargetMessageId &&
      isValidFlagged &&
      isValidReason &&
      isValidSignature,
  );
}

export function isUserComment(obj: unknown): obj is MessageData {
  return isMessageData(obj) && (obj.type === MessageType.TEXT || obj.type === MessageType.THREAD);
}

export function isReaction(obj: unknown): obj is MessageData {
  return isMessageData(obj) && obj.type === MessageType.REACTION;
}

export function isReactionArray(obj: unknown): obj is MessageData[] {
  return Boolean(Array.isArray(obj) && obj.every(r => isReaction(r)));
}

export function isLegacyUserComment(obj: unknown): obj is UserComment {
  const { username, message, address, timestamp } = (obj || {}) as UserComment;
  const { text, messageId, threadId, parent, flagged, reason } = (message || {}) as Comment;
  const isValidFlagged = flagged ? Types.isBoolean(flagged) : true;
  const isValidReason = reason ? Types.isString(reason) : true;
  const isValidAddress = address ? Types.isString(address) : true;
  const isValidMessageId = messageId ? Types.isString(messageId) : true;
  const isValidThreadId = threadId ? Types.isString(threadId) : true;
  const isValidParent = parent ? Types.isString(parent) : true;

  return Boolean(
    Types.isString(username) &&
      Types.isNumber(timestamp) &&
      Types.isString(text) &&
      isValidAddress &&
      isValidMessageId &&
      isValidThreadId &&
      isValidParent &&
      isValidFlagged &&
      isValidReason,
  );
}
