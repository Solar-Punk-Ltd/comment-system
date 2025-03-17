import { Bytes, FeedIndex, Reference } from "@ethersphere/bee-js";

interface FeedUpdateHeaders {
  feedIndex: FeedIndex;
  feedIndexNext?: FeedIndex;
}
export interface FeedPayloadResult extends FeedUpdateHeaders {
  payload: Bytes;
}
export interface FeedReferenceResult extends FeedUpdateHeaders {
  reference: Reference;
}
const feedTypes = ["sequence", "epoch"] as const;
export type FeedType = (typeof feedTypes)[number];
export const DEFAULT_FEED_TYPE: FeedType = "sequence";
