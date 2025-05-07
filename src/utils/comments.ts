import { CommentNode, UserComment } from "../model/comment.model";

/**
 * Recursively searches for a comment node with the specified ID within a tree of comment nodes.
 *
 * @param nodes - An array of `CommentNode` objects to search through.
 * @param id - The unique identifier of the comment node to find.
 * @returns The `CommentNode` with the matching ID, or `undefined` if no such node is found.
 */
export function findCommentNode(nodes: CommentNode[], id: string): CommentNode | undefined {
  let node: CommentNode | undefined;

  for (let i = 0; i < nodes.length; i++) {
    node = nodes[i];

    if (node.comment.message.messageId === id) {
      return node;
    }

    node = findCommentNode(node.replies, id);

    if (node) {
      return node;
    }
  }

  return node;
}

/**
 * Converts a flat list of user comments into a tree structure based on thread IDs.
 *
 * @param comments - An array of user comments to be transformed into a tree structure.
 * @returns An array of `CommentNode` objects representing the hierarchical structure of comments.
 *
 * Each comment is represented as a `CommentNode` containing the comment itself and its replies.
 * If a comment has a `threadId`, it is treated as a reply and added to the `replies` array
 * of the corresponding parent comment node. Comments without a `threadId` are treated as root nodes.
 */
export function commentListToTree(comments: UserComment[]): CommentNode[] {
  const nodes: CommentNode[] = [];

  comments.map(comment => {
    const { threadId } = comment.message;
    const node = { comment, replies: [] };

    if (!threadId) {
      nodes.push(node);
      return node;
    }

    const parentNode = findCommentNode(nodes, threadId);

    if (parentNode) {
      parentNode.replies.push(node);
    }

    return node;
  });

  return nodes;
}
