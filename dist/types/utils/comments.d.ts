import { Comment, CommentNode } from '../model/comment.model';
export declare function findCommentNode(nodes: CommentNode[], id: string): CommentNode | undefined;
export declare function commentListToTree(comments: Comment[]): CommentNode[];
