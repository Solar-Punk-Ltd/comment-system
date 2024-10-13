export interface CommentRequest {
    user: string;
    data: string;
    timestamp?: number;
    replyId?: string;
    id?: string;
    tags?: string[];
}
export interface Comment extends CommentRequest {
    id: string;
    timestamp: number;
    tags?: string[];
}
export interface CommentNode {
    comment: Comment;
    replies: CommentNode[];
}
export interface SingleComment {
    comment: Comment;
    nextIndex?: number;
}
export interface CommentsWithIndex {
    comments: Comment[];
    nextIndex: number;
}
