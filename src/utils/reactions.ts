import { Topic } from "@ethersphere/bee-js";
import { REACTION_ID } from "../constants/constants";

export const getReactionFeedId = (identifier: string): string => {
  return Topic.fromString(identifier.concat(REACTION_ID)).toString();
};
