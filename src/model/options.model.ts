import { BatchId, PrivateKey } from "@ethersphere/bee-js";

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
   * The signer's PrivateKey instance that can sign data.
   */
  signer?: PrivateKey;
  /**
   * The URL of the Bee node.
   * @default http://localhost:1633
   */
  beeApiUrl?: string;
  /**
   * The address of the feed that contains comments.
   * @default getAddressFromIdentifier(identifier)
   */
  address?: string;
}
