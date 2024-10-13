import { Utils } from '@ethersphere/bee-js'
import { Binary } from 'cafe-utility'
import { Index } from './types'

export function numberToFeedIndex(index: number): string {
  const bytes = new Uint8Array(8)
  const dv = new DataView(bytes.buffer)
  dv.setUint32(4, index)

  return Utils.bytesToHex(bytes)
}

export function feedIndexToNumber(index: string): number {
  const bytes = Utils.hexToBytes(index)
  const dv = new DataView(bytes.buffer)

  return dv.getUint32(4)
}

export function makeNumericIndex(index: Index): number {
  if (index instanceof Uint8Array) {
    return Binary.uint64BEToNumber(index)
  }

  if (typeof index === 'string') {
    const ix = parseInt(index)
    if (isNaN(ix)) {
      return 0
    }
    return ix
  }

  if (typeof index === 'number') {
    return index
  }

  throw new TypeError('Unknown type of index!')
}
