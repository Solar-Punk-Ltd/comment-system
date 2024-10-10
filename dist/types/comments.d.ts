import { Comment, CommentNode, CommentRequest } from './model/comment.model';
import { Options } from './model/options.model';
export declare function writeComment(comment: CommentRequest, options?: Options): Promise<Comment>;
export declare function readComments(options?: Options): Promise<Comment[]>;
export declare function readCommentsAsTree(options?: Options): Promise<CommentNode[]>;
