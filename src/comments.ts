import { Bee, Data } from '@ethersphere/bee-js'
import { ZeroHash } from 'ethers'
import { v4 as uuid } from 'uuid'
import { BEE_URL } from './constants/constants'
import { Comment, CommentNode, CommentRequest, SingleComment } from './model/comment.model'
import { getAddressFromIdentifier } from './utils/url'
import { isComment } from './asserts/models.assert'
import { numberToFeedIndex, makeNumericIndex } from './utils/feeds'
import { Options } from './model/options.model'
import { commentListToTree } from './utils'
import { DEFAULT_FEED_TYPE, FetchFeedUpdateResponse } from './utils/types'

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
    console.log('comment data upload successful: ', reference)
    const feedWriter = bee.makeFeedWriter(DEFAULT_FEED_TYPE, identifier || ZeroHash, signer)
    const r = await feedWriter.upload(stamp, reference)
    console.log('comment feed updated: ', r)

    return commentObject
  } catch (error) {
    console.error('Error while writing comment: ', error)
    return {} as Comment
  }
}

export async function writeCommentToIndex(comment: CommentRequest, options: Options): Promise<Comment> {
  try {
    const { identifier, stamp, beeApiUrl, signer, tags, startIx } = options
    if (!stamp) return {} as Comment
    if (startIx === undefined) {
      console.log('no index defined  - writing comment normally')
      return writeComment(comment, options)
    }
    const bee = new Bee(beeApiUrl || BEE_URL)

    const commentObject: Comment = {
      ...comment,
      id: comment.id || uuid(),
      timestamp: typeof comment.timestamp === 'number' ? comment.timestamp : new Date().getTime(),
      tags: tags || [],
    }

    const { reference } = await bee.uploadData(stamp, JSON.stringify(commentObject))
    console.log('comment data upload successful: ', reference)
    const feedWriter = bee.makeFeedWriter(DEFAULT_FEED_TYPE, identifier || ZeroHash, signer)
    const r = await feedWriter.upload(stamp, reference, { index: numberToFeedIndex(startIx) })
    console.log('comment feed updated: ', r)

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
    return [] as Comment[]
  }

  const bee = new Bee(beeApiUrl || BEE_URL)

  const address = optionsAddress || getAddressFromIdentifier(identifier)

  const feedReader = bee.makeFeedReader(DEFAULT_FEED_TYPE, identifier || ZeroHash, address)

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
    console.log('no start or end index - reading comments synchronously')
    return await readComments(options)
  }

  if (!identifier) {
    console.error('No identifier')
    return [] as Comment[]
  }

  const bee = new Bee(beeApiUrl || BEE_URL)
  const address = optionsAddress || getAddressFromIdentifier(identifier)
  const feedReader = bee.makeFeedReader(DEFAULT_FEED_TYPE, identifier || ZeroHash, address)
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

export async function readSingleComment(options: Options): Promise<SingleComment> {
  const { identifier, beeApiUrl, approvedFeedAddress: optionsAddress, tags, startIx } = options
  if (!identifier) {
    console.error('No identifier')
    return {} as SingleComment
  }

  const bee = new Bee(beeApiUrl || BEE_URL)

  const address = optionsAddress || getAddressFromIdentifier(identifier)

  const feedReader = bee.makeFeedReader(DEFAULT_FEED_TYPE, identifier || ZeroHash, address)
  let comment: Comment
  let feedUpdate: FetchFeedUpdateResponse
  try {
    if (startIx !== undefined) {
      feedUpdate = await feedReader.download({ index: numberToFeedIndex(startIx) })
    } else {
      feedUpdate = await feedReader.download()
    }
    const data = await bee.downloadData(feedUpdate.reference)
    const parsedData = data.json()
    if (isComment(parsedData)) {
      comment = parsedData
    } else {
      console.log('object is not a comment')
      return {} as SingleComment
    }
  } catch (error) {
    console.error('Error while reading latest comment: ', error)
    return {} as SingleComment
  }

  let nextIndex: number | undefined
  if (startIx === undefined) {
    try {
      nextIndex = makeNumericIndex(feedUpdate.feedIndexNext)
    } catch (err) {
      console.log('Error while getting next index: ', err)
      return {} as SingleComment
    }
  } else {
    nextIndex = undefined
  }

  if (tags && tags.length > 0) {
    return tags.every(tag => comment.tags?.includes(tag))
      ? { comment: comment, nextIndex: nextIndex }
      : ({} as SingleComment)
  }

  return { comment: comment, nextIndex: nextIndex }
}
