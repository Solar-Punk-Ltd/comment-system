import { Utils } from "@ethersphere/bee-js";
import { Binary } from "cafe-utility";

import { Index } from "./types";

export function numberToFeedIndex(index: number | undefined): string | undefined {
  if (index === undefined) {
    return undefined;
  }
  const bytes = new Uint8Array(8);
  const dv = new DataView(bytes.buffer);
  dv.setUint32(4, index);

  return Utils.bytesToHex(bytes);
}

export function makeNumericIndex(index: Index): number {
  if (index instanceof Uint8Array) {
    return Binary.uint64BEToNumber(index);
  }

  if (typeof index === "string") {
    const base = 16;
    const ix = parseInt(index, base);
    if (isNaN(ix)) {
      throw new TypeError(`Invalid index: ${index}`);
    }
    return ix;
  }

  if (typeof index === "number") {
    return index;
  }

  throw new TypeError(`Unknown type of index: ${index}`);
}
