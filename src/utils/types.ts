import { ReferenceResponse } from '@ethersphere/bee-js'

export interface Bytes<Length extends number> extends Uint8Array {
  readonly length: Length
}
export type IndexBytes = Bytes<8>
export interface Epoch {
  time: number
  level: number
}
export type Index = number | Epoch | IndexBytes | string
interface FeedUpdateHeaders {
  feedIndex: Index
  feedIndexNext: string
}
export interface FetchFeedUpdateResponse extends ReferenceResponse, FeedUpdateHeaders {}
const feedTypes = ['sequence', 'epoch'] as const
export type FeedType = (typeof feedTypes)[number]
export const DEFAULT_FEED_TYPE: FeedType = 'sequence'
