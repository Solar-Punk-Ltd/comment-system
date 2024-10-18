import { Comment, CommentNode, CommentRequest, SingleComment } from './model/comment.model';
import { Options } from './model/options.model';
export declare function writeComment(comment: CommentRequest, options?: Options): Promise<Comment>;
export declare function writeCommentToIndex(comment: CommentRequest, options: Options): Promise<Comment>;
export declare function readComments(options?: Options): Promise<Comment[]>;
export declare function readCommentsAsTree(options?: Options): Promise<CommentNode[]>;
export declare function readCommentsAsync(options: Options): Promise<Comment[]>;
export declare function readSingleComment(options: Options): Promise<SingleComment>;
