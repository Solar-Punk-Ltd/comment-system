import { BatchId, Signer } from "@ethersphere/bee-js"

export interface Options {
  stamp?: string | BatchId // defaults to getUsableStamp()
  identifier?: string // defaults to getIdentifierFromUrl(window.location.href)
  signer?: Signer | Uint8Array | string // signer's private key or a Signer instance that can sign data
  beeApiUrl?: string // defaults to http://localhost:1633
  approvedFeedAddress?: string // Address of feed that contains approved comments, defaults to getAddressFromIdentifier(identifier)
  startIx?: number // start index to load comments in the feed
  endIx?: number // end index for loading comments in the feed
}
