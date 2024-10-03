export function findCommentNode(nodes, id) {
    let node;
    for (let i = 0; i < nodes.length; i++) {
        node = nodes[i];
        if (node.comment.id === id) {
            return node;
        }
        node = findCommentNode(node.replies, id);
        if (node) {
            return node;
        }
    }
    return node;
}
export function commentListToTree(comments) {
    const nodes = [];
    comments.map(comment => {
        const { replyId } = comment;
        const node = { comment, replies: [] };
        if (!replyId) {
            nodes.push(node);
            return node;
        }
        const parentNode = findCommentNode(nodes, replyId);
        if (parentNode) {
            parentNode.replies.push(node);
        }
        return node;
    });
    return nodes;
}
