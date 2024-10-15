import { Utils } from '@ethersphere/bee-js';
import { Binary } from 'cafe-utility';
export function numberToFeedIndex(index) {
    const bytes = new Uint8Array(8);
    const dv = new DataView(bytes.buffer);
    dv.setUint32(4, index);
    return Utils.bytesToHex(bytes);
}
export function makeNumericIndex(index) {
    if (index instanceof Uint8Array) {
        return Binary.uint64BEToNumber(index);
    }
    if (typeof index === 'string') {
        const base = 16;
        const ix = parseInt(index, base);
        if (isNaN(ix)) {
            return 0;
        }
        return ix;
    }
    if (typeof index === 'number') {
        return index;
    }
    throw new TypeError('Unknown type of index!');
}
