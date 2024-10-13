import { Comment, CommentNode, CommentRequest, LatestComment } from './model/comment.model';
import { Options } from './model/options.model';
export declare function writeComment(comment: CommentRequest, options?: Options): Promise<Comment>;
export declare function readComments(options?: Options): Promise<Comment[]>;
export declare function readCommentsAsTree(options?: Options): Promise<CommentNode[]>;
export declare function readCommentsAsync(options: Options): Promise<Comment[]>;
export declare function readLatestComment(options: Options): Promise<LatestComment>;
