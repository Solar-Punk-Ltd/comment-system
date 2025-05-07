# Swarm Comment System Library

A library for writing and reading comments from the Swarm network.

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
import { writeComment, writeCommentToIndex } from "@solarpunkltd/comment-system";

const comment = {
  message: {
    text: "This is a comment",
    messageId: "unique-message-id",
  },
  timestamp: Date.now(),
  username: "user123",
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

Function writeComment writes a comment to the next feed index. It needs to look up the latest feed index before writing.
Function writeCommentToIndex writes a comment to the desired specific index.

### Reading

To read comments from the Swarm network, use the readComments, readCommentsInRange or readSingleComment functions:

```javascript
import { readComments, readCommentsInRange, readSingleComment } from "swarm-comment-system";

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

Function readComments reads comments from index 0 until the latest found index, in succession. Function
readCommentsInRange reads comments from the desired index range, parlelly. Function readSingleComment reads one single
comment at the given index, if not provided it looks up and reads the latest comment.

### Reactions

### State udpate

Every **Comment.messageId** identifies a feed topic for its reactions. Each topic can be determined the following way:

```javascript
const messageId = comment.message.messageId;
const reactionFeedId = getReactionFeedId(messageId);
```

Each feed update stores the latest state of the reactions, so each feed entry is a reactions array containing the entire
comment reaction state. This way only one fetch request is needed for getting the latest reactions. On the other hand,
each new reaction requires a state change.

In order to update the state of the reactions feed with a new reaction, the following utility function is provided:

```javascript
const reactionType = "like";
const messageId = comment.message.messageId;
const newReaction = {
  user,
  targetMessageId: messageId,
  timestamp: Date.now(),
  reactionType,
};
const updatedState = updateReactions(reactionState, newReaction, Action.ADD);
```

The state is updated (aggregated) according to the action defined. However clients can define their own way of
aggregation, this function only serves as a default implementation. It returns **undefined** in case the state needs no
update (e.g.: new reactin is to be added but is already present).

### Writing and Reading

Writing and reading reactions works in a similar way to the comments. Once the new reaction state and feedId is
determined, it can be simply written as the latest feed update:

```javascript
const reactionState = await readReactionsWithIndex(undefined, {
  identifier: reactionFeedId,
  address: "your-signer-address",
});

await writeReactionsToIndex(updatedState, reactionState.nextIndex, {
  stamp: "your-stamp-id",
  identifier: reactionFeedId,
  signer: "your-private-key",
  address: "your-signer-address",
});
```

## Limitations

Writing to a feed index that is already taken does not result in an error, therefore reading back the comment at the
expected index is necessary as a verification of success.

## Example react-app

See https://github.com/Solar-Punk-Ltd/comment-system-ui

## License

This README provides an overview of the swarm comment-system library, including installation instructions, usage
examples, and descriptions of the main functions and types. Adjust the content as needed to fit your specific library
details.
