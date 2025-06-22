import { User } from "./user.model";

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
  index: number;
  chatTopic: string;
  targetMessageId?: string;
  signature?: string;
  userTopic?: string;
  flagged?: boolean;
  reason?: string;
}

export interface Comment {
  text: string;
  messageId?: string;
  threadId?: string;
  parent?: string;
  flagged?: boolean;
  reason?: string;
}

export interface UserComment {
  message: Comment;
  timestamp: number;
  user: User;
}

export interface CommentNode {
  comment: MessageData;
  replies: CommentNode[];
}

export interface SingleComment {
  comment: MessageData;
  nextIndex?: string;
}

export interface CommentsWithIndex {
  comments: MessageData[];
  nextIndex: string;
}
