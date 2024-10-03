import { Bee } from '@ethersphere/bee-js'
import { ZeroHash } from 'ethers'
import { v4 as uuid } from 'uuid'
import { BEE_URL } from './constants/constants'
import { Comment, CommentNode, CommentRequest } from './model/comment.model'
import { getAddressFromIdentifier } from './utils/url'
import { isComment } from './asserts/models.assert'
import { numberToFeedIndex } from './utils/feeds'
import { Options } from './model/options.model'
import { commentListToTree } from './utils'

export async function writeComment(comment: CommentRequest, options?: Options): Promise<Comment> {
  try {
    if (!options) return {} as Comment
    const { identifier, stamp, beeApiUrl, signer } = options
    if (!stamp) return {} as Comment
    //  const privateKey = optionsPrivateKey// || getPrivateKeyFromIdentifier(identifier) deprecated
    const bee = new Bee(beeApiUrl || BEE_URL)

    const commentObject: Comment = {
      ...comment,
      id: comment.id || uuid(),
      timestamp: typeof comment.timestamp === 'number' ? comment.timestamp : new Date().getTime(),
    }

    const { reference } = await bee.uploadData(stamp, JSON.stringify(commentObject))
    console.log('Data upload successful: ', reference)
    console.log('Signer', signer)
    const feedWriter = bee.makeFeedWriter('sequence', identifier || ZeroHash, signer)
    console.log('feedWriter made: ', feedWriter)

    const r = await feedWriter.upload(stamp, reference)
    console.log('feed updated: ', r)

    return commentObject
  } catch (error) {
    console.error('Error while writing comment: ', error)
    return {} as Comment
  }
}

export async function readComments(options?: Options): Promise<Comment[]> {
  if (!options) return []
  const { identifier, beeApiUrl, approvedFeedAddress: optionsAddress } = options
  if (!identifier) {
    console.error('No identifier')
    return []
  }

  const bee = new Bee(beeApiUrl || BEE_URL)

  const address = optionsAddress || getAddressFromIdentifier(identifier)

  const feedReader = bee.makeFeedReader('sequence', identifier || ZeroHash, address)

  const comments: Comment[] = []

  let nextIndex = 0

  while (true) {
    try {
      const feedUpdate = await feedReader.download({ index: numberToFeedIndex(nextIndex++) })

      const data = await bee.downloadData(feedUpdate.reference)

      const comment = data.json()

      if (isComment(comment)) {
        comments.push(comment)
      }
    } catch (error) {
      break
    }
  }

  return comments
}

export async function readCommentsAsTree(options?: Options): Promise<CommentNode[]> {
  const comments = await readComments(options)

  return commentListToTree(comments)
}
