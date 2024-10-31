import { Signer } from '@ethersphere/bee-js'

export interface Options {
  stamp?: string // defaults to getUsableStamp()
  identifier?: string // defaults to getIdentifierFromUrl(window.location.href)
  signer?: Signer // signer object to which signs the feed updates
  beeApiUrl?: string // defaults to http://localhost:1633
  privateKey?: string // If set, private key won't be derived from identifier
  approvedFeedAddress?: string // Address of feed that contains approved comments
  filter?: boolean // determines whether or not the comment(s) shall be filtered by the flag
  startIx?: number // start index to load comments in the feed
  endIx?: number // end index for loading comments in the feed
}
