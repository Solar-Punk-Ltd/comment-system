import { CommentNode, UserComment } from "../model/comment.model";

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
