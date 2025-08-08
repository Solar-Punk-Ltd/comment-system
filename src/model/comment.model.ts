export enum MessageType {
  TEXT = "text",
  THREAD = "thread",
  REACTION = "reaction",
}

export interface MessageData {
  id: string;
  type: MessageType;
  message: string;
  username: string;
  address: string;
  timestamp: number;
  index: string;
  topic: string;
  targetMessageId?: string;
  signature?: string;
  flagged?: boolean;
  reason?: string;
}

export interface CommentNode {
  message: MessageData;
  replies: CommentNode[];
}

export interface SingleMessage {
  message: MessageData;
  nextIndex?: string;
}

export interface MessageWithIndex {
  messages: MessageData[];
  nextIndex: string;
}
