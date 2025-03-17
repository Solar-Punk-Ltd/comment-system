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
  username: string;
  address?: string;
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
