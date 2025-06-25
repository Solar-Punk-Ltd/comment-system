import { Types } from "cafe-utility";

import { MessageData, MessageType } from "../model/comment.model";

export function isMessageData(obj: unknown): obj is MessageData {
  const {
    id,
    index,
    type,
    chatTopic,
    message,
    timestamp,
    username,
    address,
    targetMessageId,
    flagged,
    reason,
    signature,
    userTopic,
  } = (obj || {}) as MessageData;
  const isValidId = id ? Types.isString(id) : true;
  const isValidSignature = signature ? Types.isString(signature) : true;
  const isValidUserTopic = userTopic ? Types.isString(userTopic) : true;
  const isValidTargetMessageId = targetMessageId ? Types.isString(targetMessageId) : true;
  const isValidFlagged = flagged ? Types.isBoolean(flagged) : true;
  const isValidReason = reason ? Types.isString(reason) : true;

  return Boolean(
    Types.isString(message) &&
      Types.isNumber(timestamp) &&
      Types.isString(username) &&
      Types.isString(address) &&
      Types.isNumber(index) &&
      Types.isString(type) &&
      Types.isString(chatTopic) &&
      isValidId &&
      isValidTargetMessageId &&
      isValidFlagged &&
      isValidReason &&
      isValidSignature &&
      isValidUserTopic,
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
