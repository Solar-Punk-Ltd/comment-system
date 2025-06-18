import { User } from "./user.model";

export type AddAction = "add";
export type RemoveAction = "remove";
export type EditAction = "edit";
export type Action = AddAction | RemoveAction | EditAction;

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
