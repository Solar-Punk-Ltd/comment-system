import { BatchId, Signer } from "@ethersphere/bee-js"

/**
 * Options for the comments API
 */
export interface Options {
  /**
   * stamp The stamp of the feed, defaults to getUsableStamp()
   */
  stamp?: string | BatchId
  /**
   * identifier The identifier / hashed topic of the feed, defaults to getIdentifierFromUrl(window.location.href)
   */
  identifier?: string
  /**
   * signer The signer's private key or a Signer instance that can sign data
   */
  signer?: Signer | Uint8Array | string
  /**
   * beeApiUrl The URL of the Bee node, defaults to http://localhost:1633
   */
  beeApiUrl?: string
  /**
   * approvedFeedAddress The address of the feed that contains approved comments, , defaults to getAddressFromIdentifier(identifier)
   */
  approvedFeedAddress?: string
  /**
   * startIx The start index to load comments in the feed
   */
  startIx?: number
  /**
   * endIx The end index to load comments in the feed
   */
  endIx?: number
}
