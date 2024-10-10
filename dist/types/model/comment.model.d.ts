export interface CommentRequest {
    user: string;
    data: string;
    timestamp?: number;
    replyId?: string;
    id?: string;
}
export interface Comment extends CommentRequest {
    id: string;
    timestamp: number;
}
export interface CommentNode {
    comment: Comment;
    replies: CommentNode[];
}
