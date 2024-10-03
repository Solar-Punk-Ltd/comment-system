import { Signer } from '@ethersphere/bee-js';
export interface Options {
    stamp?: string;
    identifier?: string;
    signer?: Signer;
    beeApiUrl?: string;
    privateKey?: string;
    approvedFeedAddress?: string;
}
