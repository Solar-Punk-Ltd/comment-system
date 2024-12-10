import { BatchId, Signer } from "@ethersphere/bee-js";

/**
 * Options for configuring the comment system API.
 */
export interface Options {
  /**
   * The stamp used to upload data.
   * @default getUsableStamp()
   */
  stamp?: string | BatchId;
  /**
   * The identifier or hashed topic of the feed.
   * @default getIdentifierFromUrl(window.location.href)
   */
  identifier?: string;
  /**
   * The signer's private key or a Signer instance that can sign data.
   */
  signer?: Signer | Uint8Array | string;
  /**
   * The URL of the Bee node.
   * @default http://localhost:1633
   */
  beeApiUrl?: string;
  /**
   * The address of the feed that contains approved comments.
   * @default getAddressFromIdentifier(identifier)
   */
  approvedFeedAddress?: string;
}
