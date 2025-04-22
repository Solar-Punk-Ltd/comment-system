import { User } from "./user.model";

export interface Comment {
  text: string;
  messageId?: string;
  threadId?: string;
  parent?: string;
  flagged?: boolean;
  reason?: string;
}

// TODO: user probably not compatible with legacy objs.
export interface UserComment {
  message: Comment;
  timestamp: number;
  user: User;
}

export interface CommentNode {
  comment: UserComment;
  replies: CommentNode[];
}

export interface SingleComment {
  comment: UserComment;
  nextIndex?: string;
}

export interface CommentsWithIndex {
  comments: UserComment[];
  nextIndex: string;
}
