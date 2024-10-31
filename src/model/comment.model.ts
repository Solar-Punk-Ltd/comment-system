export interface Comment {
  text: string
  messageId?: string
  threadId?: string
  parent?: string
  flagged?: boolean
  reason?: string
}

export interface UserComment {
  message: Comment
  timestamp: number
  username: string
  address?: string
}

export interface CommentNode {
  comment: UserComment
  replies: CommentNode[]
}

export interface SingleComment {
  comment: UserComment
  nextIndex?: number
}

export interface CommentsWithIndex {
  comments: UserComment[]
  nextIndex: number
}

export interface LegacyCommentRequest {
  user: string
  data: string
  timestamp?: number
  replyId?: string
  id?: string
  tags?: string[]
}

export interface LegacyComment extends LegacyCommentRequest {
  id: string
  timestamp: number
  tags?: string[]
}
