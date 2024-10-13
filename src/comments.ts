import { Bee, Data } from '@ethersphere/bee-js'
import { ZeroHash } from 'ethers'
import { v4 as uuid } from 'uuid'
import { BEE_URL } from './constants/constants'
import { Comment, CommentNode, CommentRequest, LatestComment } from './model/comment.model'
import { getAddressFromIdentifier } from './utils/url'
import { isComment } from './asserts/models.assert'
import { numberToFeedIndex, feedIndexToNumber } from './utils/feeds'
import { Options } from './model/options.model'
import { commentListToTree } from './utils'
import { FetchFeedUpdateResponse } from './utils/types'

export async function writeComment(comment: CommentRequest, options?: Options): Promise<Comment> {
  try {
    if (!options) return {} as Comment
    const { identifier, stamp, beeApiUrl, signer, tags } = options
    if (!stamp) return {} as Comment
    const bee = new Bee(beeApiUrl || BEE_URL)

    const commentObject: Comment = {
      ...comment,
      id: comment.id || uuid(),
      timestamp: typeof comment.timestamp === 'number' ? comment.timestamp : new Date().getTime(),
      tags: tags || [],
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
  const { identifier, beeApiUrl, approvedFeedAddress: optionsAddress, tags } = options
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
      console.log('baogy readComments nextIndex: ', nextIndex)
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

  if (tags && tags.length > 0) {
    return comments.filter(comment => tags.every(tag => comment.tags?.includes(tag)))
  }

  return comments
}

export async function readCommentsAsTree(options?: Options): Promise<CommentNode[]> {
  const comments = await readComments(options)

  return commentListToTree(comments)
}

export async function readCommentsAsync(options: Options): Promise<Comment[]> {
  const { identifier, beeApiUrl, approvedFeedAddress: optionsAddress, tags, startIx, endIx } = options
  if (startIx === undefined || endIx === undefined) {
    return await readComments(options)
  }

  if (!identifier) {
    console.error('No identifier')
    return []
  }

  const bee = new Bee(beeApiUrl || BEE_URL)
  const address = optionsAddress || getAddressFromIdentifier(identifier)
  const feedReader = bee.makeFeedReader('sequence', identifier || ZeroHash, address)
  const comments: Comment[] = []

  const actualStartIx = endIx > startIx ? startIx : endIx
  const feedUpdatePromises: Promise<FetchFeedUpdateResponse>[] = []
  for (let i = actualStartIx; i <= endIx; i++) {
    feedUpdatePromises.push(feedReader.download({ index: numberToFeedIndex(i) }))
  }
  const dataPromises: Promise<Data>[] = []
  await Promise.allSettled(feedUpdatePromises).then(results => {
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        dataPromises.push(bee.downloadData(result.value.reference))
      } else {
        console.log('error fetching feed update: ', result.reason)
      }
    })
  })

  await Promise.allSettled(dataPromises).then(results => {
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const comment = (result.value as Data).json()
        if (isComment(comment)) {
          comments.push(comment)
        }
      } else {
        console.log('error fetching comment data: ', result.reason)
      }
    })
  })

  comments.sort((a, b) => a.timestamp - b.timestamp)

  if (tags && tags.length > 0) {
    return comments.filter(comment => tags.every(tag => comment.tags?.includes(tag)))
  }

  return comments
}

export async function readLatestComment(options: Options): Promise<LatestComment> {
  const { identifier, beeApiUrl, approvedFeedAddress: optionsAddress, tags } = options
  if (!identifier) {
    console.error('No identifier')
    return {} as LatestComment
  }

  const bee = new Bee(beeApiUrl || BEE_URL)

  const address = optionsAddress || getAddressFromIdentifier(identifier)

  const feedReader = bee.makeFeedReader('sequence', identifier || ZeroHash, address)
  let comment: Comment
  let feedUpdate: FetchFeedUpdateResponse
  try {
    feedUpdate = await feedReader.download()
    const data = await bee.downloadData(feedUpdate.reference)
    const parsedData = data.json()
    if (isComment(parsedData)) {
      comment = parsedData
    } else {
      console.log('object is not a comment')
      return {} as LatestComment
    }
  } catch (error) {
    console.error('Error while reading latest comment: ', error)
    return {} as LatestComment
  }

  const nextIndex = feedIndexToNumber(feedUpdate.feedIndexNext)
  // TODO: fix tag filtering
  if (tags && tags.length > 0) {
    return tags.every(tag => comment.tags?.includes(tag))
      ? { comment: comment, nextIndex: nextIndex }
      : ({} as LatestComment)
  }

  return { comment: comment, nextIndex: nextIndex }
}
