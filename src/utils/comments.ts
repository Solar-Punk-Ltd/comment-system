import { DEFAULT_BEE_URL } from "../constants/constants";
import { CommentNode, UserComment } from "../model/comment.model";
import { Options } from "../model/options.model";
import { Optional } from "../model/util.types";

import { IdentifierError, StampError } from "./errors";
import { getUsableStamp } from "./stamps";
import { getIdentifierFromUrl } from "./url";

async function prepareOptions(
  options: Options = {},
  stampRequired = true,
): Promise<Optional<Required<Options>, "stamp" | "signer" | "address">> {
  const beeApiUrl = options.beeApiUrl ?? DEFAULT_BEE_URL;
  const { signer, address } = options;
  let { identifier, stamp } = options;

  if (!identifier) {
    identifier = getIdentifierFromUrl(window.location.href);
  }

  if (!identifier) {
    throw new IdentifierError("Cannot generate private key from an invalid URL");
  }

  if (!stamp && stampRequired) {
    const usableStamp = await getUsableStamp(beeApiUrl);

    if (!usableStamp) {
      throw new StampError("No available stamps found.");
    }

    stamp = usableStamp.batchID;
  }

  return {
    stamp,
    identifier,
    beeApiUrl,
    signer,
    address,
  };
}

export function prepareWriteOptions(options: Options = {}): Promise<Optional<Required<Options>, "signer">> {
  return prepareOptions(options) as Promise<Optional<Required<Options>, "signer">>;
}

export function prepareReadOptions(
  options: Options = {},
): Promise<Omit<Optional<Required<Options>, "address">, "stamp" | "signer">> {
  return prepareOptions(options, false);
}

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
