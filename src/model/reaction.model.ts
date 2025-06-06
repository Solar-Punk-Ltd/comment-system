import { User } from "./user.model";

export enum Action {
  ADD = "add",
  REMOVE = "remove",
  EDIT = "edit",
}

export interface Reaction {
  targetMessageId: string;
  user: User;
  reactionType: string;
  timestamp: number;
  reactionId?: string;
}

export interface SingleReaction {
  reaction: Reaction;
  nextIndex?: string;
}

export interface ReactionsWithIndex {
  reactions: Reaction[];
  nextIndex: string;
}
