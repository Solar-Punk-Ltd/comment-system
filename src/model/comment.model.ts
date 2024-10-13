export interface CommentRequest {
  user: string
  data: string
  timestamp?: number
  replyId?: string
  id?: string
  tags?: string[]
}

export interface Comment extends CommentRequest {
  id: string
  timestamp: number
  tags?: string[]
}

export interface CommentNode {
  comment: Comment
  replies: CommentNode[]
}

export interface LatestComment {
  comment: Comment
  nextIndex: number
}

export interface LastNComments {
  comments: Comment[]
  nextIndex: number
}
