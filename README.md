# Swarm Comment System Library

A library for writing and reading comments from the Swarm network utilizing the concept of graffiti feeds.

## Installation

To install the library, use npm or yarn:

```bash
npm i @solarpunkltd/comment-system
```

## Usage

### Comments

### Writing

To write a comment to the Swarm network, use the writeComment or writeCommentToIndex functions:

```javascript
import { writeComment, writeCommentToIndex, MessageType } from "@solarpunkltd/comment-system";

const comment = {
  id: "unique-comment-id",
  type: MessageType.TEXT,
  message: "This is a comment",
  username: "user123",
  address: "user-address",
  timestamp: Date.now(),
  index: "0",
  topic: "your-feed-topic",
  targetMessageId: "parent-message-id",
};

const options = {
  stamp: "your-stamp-id",
  signer: "your-private-key",
  beeApiUrl: "https://your-bee-node-url",
  address: "your-feed-address",
};

writeComment(comment, options)
  .then(result => {
    console.log("Comment written:", result);
  })
  .catch(error => {
    console.error("Error writing comment:", error);
  });

const index = FeedIndex.fromBigInt(123n);
writeCommentToIndex(comment, index, options)
  .then(result => {
    console.log(`Comment written to index ${index}:`, result);
  })
  .catch(error => {
    console.error(`Error writing comment to index ${index}`, error);
  });
```

Function writeComment writes a comment to the next feed index and returns an UploadResult object. It needs to look up
the latest feed index before writing. Function writeCommentToIndex writes a comment to the desired specific index and
returns an UploadResult object.

### Reading

To read comments from the Swarm network, use the readComments, readCommentsInRange or readSingleComment functions:

```javascript
import { readComments, readCommentsInRange, readSingleComment } from "@solarpunkltd/comment-system";

const options = {
  identifier: "your-identifier",
  beeApiUrl: "https://your-bee-node-url",
  address: "your-feed-address",
};

readComments(options)
  .then(comments => {
    console.log("Comments read:", comments);
  })
  .catch(error => {
    console.error("Error reading comments:", error);
  });

const start = FeedIndex.fromBigInt(0n);
const end = FeedIndex.fromBigInt(10n);
readCommentsInRange(start, end, options)
  .then(comments => {
    console.log(`Comments read from range ${start} to ${end}:`, comments);
  })
  .catch(error => {
    console.error(`Error reading comments from range ${start} to ${end}:`, error);
  });

const index = FeedIndex.fromBigInt(3n);
readSingleComment(index, options)
  .then(comments => {
    console.log(`Comment read at index ${index}:`, comments);
  })
  .catch(error => {
    console.error(`Error reading comment at index ${index}:`, error);
  });
```

Function readComments reads comments from index 0 until the latest found index, in succession. It also supports legacy
comment formats and automatically transforms them to the current MessageData format. Function readCommentsInRange reads
comments from the desired index range, in parallel, with improved error handling that distinguishes between critical
errors and missing comments (404 Not Found). Function readSingleComment reads one single comment at the given index, if
not provided it looks up and reads the latest comment. It returns the comment data directly as MessageData.

### Reactions

### State update

There are multiple ways of handling reactions for the comments/messages, providing below 2 examples. Every
**Comment.id** identifies a feed topic for its reactions. Or maintaing a separate feed, derived from the original feed
topic. While the first method keeps the reaction state separately for each comment as a new feed (smaller sates but many
requests - bandwidth issues ), the latter stores the whole reaction state (big state that can be split up but only one
poll reqeust needed). Each topic can be determined the following way:

```javascript
import { getReactionFeedId } from "@solarpunkltd/comment-system";

const reactionFeedId = getReactionFeedId("comment-feed-identifier");
const reactionFeedIdForComment = getReactionFeedIdForComment(comment.id);
```

Each feed update stores the latest state of the reactions, so each feed entry is a reactions array containing the entire
comment reaction state. This way only one fetch request is needed for getting the latest reactions. On the other hand,
each new reaction requires a state change.

In order to update the state of the reactions feed with a new reaction, the following utility function is provided:

```javascript
import { updateReactions, MessageType } from "@solarpunkltd/comment-system";

const commentId = comment.id;
const newReaction = {
  id: "reaction-id",
  type: MessageType.REACTION,
  message: "like",
  username: "user123",
  address: "user-address",
  timestamp: Date.now(),
  index: "0",
  topic: "reaction-topic",
  targetMessageId: commentId,
};
const updatedState = updateReactions(reactionState, newReaction);
```

The state is updated (aggregated) according to the reaction logic. If a reaction from the same user and type already
exists, it will be removed (toggle behavior). If it doesn't exist, it will be added. The function returns **undefined**
in case the state needs no update.

### Writing and Reading

Writing and reading reactions works in a similar way to the comments. The writeReactionsToIndex function now returns an
UploadResult object, and readReactionsWithIndex always returns a MessagesWithIndex object (never undefined). Once the
new reaction state and feedId is determined, it can be simply written as the latest feed update:

```javascript
import { writeReactionsToIndex, readReactionsWithIndex, getReactionFeedId } from "@solarpunkltd/comment-system";

const reactionFeedId = getReactionFeedId(commentId);
const reactionState = await readReactionsWithIndex(undefined, {
  identifier: reactionFeedId,
  address: "your-signer-address",
});

await writeReactionsToIndex(updatedState, reactionState?.nextIndex, {
  stamp: "your-stamp-id",
  identifier: reactionFeedId,
  signer: "your-private-key",
  address: "your-signer-address",
});
```

## Types

### MessageData

The main interface for comments and reactions, complying with the interface at
[swarm-chat-js](https://github.com/Solar-Punk-Ltd/swarm-chat-js)

```typescript
interface MessageData {
  id: string;
  type: MessageType; // TEXT, THREAD, or REACTION
  message: string;
  username: string;
  address: string;
  timestamp: number;
  index: string;
  topic: string; // For the feed indentifier
  targetMessageId?: string; // For replies and reactions
  signature?: string; // For user verification
  flagged?: boolean; // For UI filtering
  reason?: string;
  isLegacy?: boolean; // Indicates if this was transformed from legacy format
}
```

### MessageType

Enum defining the type of message:

```typescript
enum MessageType {
  TEXT = "text",
  THREAD = "thread",
  REACTION = "reaction",
}
```

### Options

Configuration options for reading and writing:

```typescript
interface Options {
  stamp?: string;
  identifier?: string;
  beeApiUrl?: string;
  signer?: PrivateKey;
  address?: string;
}
```

<!-- todo: udpate readme to latest signatures -->

## Functions

### Comments

- `writeComment(comment: MessageData, options?: Options): Promise<UploadResult | undefined>`
- `writeCommentToIndex(comment: MessageData, index?: FeedIndex, options?: Options): Promise<UploadResult | undefined>`
- `readComments(options?: Options): Promise<MessageData[] | undefined>`
- `readCommentsInRange(start?: FeedIndex, end?: FeedIndex, options?: Options): Promise<MessageData[] | undefined>`
- `readCommentsAsTree(start?: FeedIndex, end?: FeedIndex, options?: Options): Promise<CommentNode[] | undefined>`
- `readSingleComment(index?: FeedIndex, options?: Options): Promise<MessageData | undefined>`

### Reactions

- `writeReactionsToIndex(reactions: MessageData[], index?: FeedIndex, options?: Options): Promise<UploadResult | undefined>`
- `readReactionsWithIndex(index?: FeedIndex, options?: Options): Promise<MessagesWithIndex>`
- `getReactionFeedId(identifier?: string): Topic`
- `updateReactions(reactions: MessageData[], newReaction: MessageData): MessageData[] | undefined`

### Utilities

- `getPrivateKeyFromIdentifier(identifier: string): PrivateKey` - Generates a private key from a given identifier string

## Utilities

### Key Generation

```javascript
import { getPrivateKeyFromIdentifier } from "@solarpunkltd/comment-system";

const identifier = "my-unique-identifier";
const privateKey = getPrivateKeyFromIdentifier(identifier);
```

## Limitations

Writing to a feed index that is already taken does not result in an error, therefore reading back the comment at the
expected index is necessary as a verification of success.

## Examples

See: [comment-system-ui](https://github.com/Solar-Punk-Ltd/comment-system-ui) as a basic example.

[swarm-chat-react-example](https://github.com/Solar-Punk-Ltd/swarm-chat-react-example) as a complete chat-like/
comment-feed app.

## License

This README provides an overview of the swarm comment-system library, including installation instructions, usage
examples, and descriptions of the main functions and types. Adjust the content as needed to fit your specific library
details.
