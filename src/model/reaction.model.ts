export enum Action {
  ADD = "add",
  REMOVE = "remove",
  EDIT = "edit",
}

export interface Reaction {
  targetMessageId: string;
  user: User;
  action: Action;
  reactionType: string;
  timestamp: number;
  reactionId?: string;
}

interface User {
  username: string;
  address?: string;
}

export interface SingleReaction {
  reaction: Reaction;
  nextIndex?: string;
}

export interface ReactionsWithIndex {
  reactions: Reaction[];
  nextIndex: string;
}
