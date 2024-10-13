import { ReferenceResponse } from '@ethersphere/bee-js';
export interface Bytes<Length extends number> extends Uint8Array {
    readonly length: Length;
}
export type IndexBytes = Bytes<8>;
export interface Epoch {
    time: number;
    level: number;
}
export type Index = number | Epoch | IndexBytes | string;
interface FeedUpdateHeaders {
    feedIndex: Index;
    feedIndexNext: string;
}
export interface FetchFeedUpdateResponse extends ReferenceResponse, FeedUpdateHeaders {
}
export {};
