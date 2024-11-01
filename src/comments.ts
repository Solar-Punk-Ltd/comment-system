import { Bee, Data } from '@ethersphere/bee-js'
import { ZeroHash } from 'ethers'
import { v4 as uuid } from 'uuid'
import { BEE_URL } from './constants/constants'
import { Comment, CommentNode, UserComment, SingleComment } from './model/comment.model'
import { getAddressFromIdentifier } from './utils/url'
import { isUserComment, isLegacyComment } from './asserts/models.assert'
import { numberToFeedIndex, makeNumericIndex } from './utils/feeds'
import { Options } from './model/options.model'
import { commentListToTree } from './utils'
import { DEFAULT_FEED_TYPE, FetchFeedUpdateResponse } from './utils/types'

export async function writeComment(comment: UserComment, options?: Options): Promise<UserComment> {
  try {
    if (!options) return {} as UserComment
    const { identifier, stamp, beeApiUrl, signer } = options
    if (!stamp) return {} as UserComment
    const bee = new Bee(beeApiUrl || BEE_URL)

    const commentObject: Comment = {
      ...comment.message,
      messageId: comment.message.messageId || uuid(),
    }

    const userCommentObj: UserComment = {
      message: commentObject,
      timestamp: typeof comment.timestamp === 'number' ? comment.timestamp : new Date().getTime(),
      username: comment.username,
    }

    const { reference } = await bee.uploadData(stamp, JSON.stringify(userCommentObj))
    console.log('Comment data upload successful: ', reference)
    const feedWriter = bee.makeFeedWriter(DEFAULT_FEED_TYPE, identifier || ZeroHash, signer)
    const r = await feedWriter.upload(stamp, reference)
    console.log('Comment feed updated: ', r.reference)

    return userCommentObj
  } catch (error) {
    console.error('Error while writing comment: ', error)
    return {} as UserComment
  }
}

export async function writeCommentToIndex(comment: UserComment, options: Options): Promise<UserComment> {
  try {
    const { identifier, stamp, beeApiUrl, signer, startIx } = options
    if (!stamp) return {} as UserComment
    if (startIx === undefined) {
      console.log('No index defined - writing comment to the latest index')
      return writeComment(comment, options)
    }
    const bee = new Bee(beeApiUrl || BEE_URL)

    const commentObject: Comment = {
      ...comment.message,
      messageId: comment.message.messageId || uuid(),
    }

    const userCommentObj: UserComment = {
      message: commentObject,
      timestamp: typeof comment.timestamp === 'number' ? comment.timestamp : new Date().getTime(),
      username: comment.username,
    }

    const { reference } = await bee.uploadData(stamp, JSON.stringify(userCommentObj))
    console.log('Comment data upload successful: ', reference)
    const feedWriter = bee.makeFeedWriter(DEFAULT_FEED_TYPE, identifier || ZeroHash, signer)
    const r = await feedWriter.upload(stamp, reference, { index: numberToFeedIndex(startIx) })
    console.log('Comment feed updated: ', r.reference)

    return userCommentObj
  } catch (error) {
    console.error('Error while writing comment: ', error)
    return {} as UserComment
  }
}

// TODO: remove legacy comments
export async function readComments(options?: Options): Promise<UserComment[]> {
  if (!options) return []
  const { identifier, beeApiUrl, approvedFeedAddress: optionsAddress } = options
  if (!identifier) {
    console.error('No identifier')
    return [] as UserComment[]
  }

  const bee = new Bee(beeApiUrl || BEE_URL)

  const address = optionsAddress || getAddressFromIdentifier(identifier)

  const feedReader = bee.makeFeedReader(DEFAULT_FEED_TYPE, identifier || ZeroHash, address)

  const userComments: UserComment[] = []

  let nextIndex = 0

  while (true) {
    try {
      const feedUpdate = await feedReader.download({ index: numberToFeedIndex(nextIndex++) })

      const data = await bee.downloadData(feedUpdate.reference)

      const comment = data.json()

      if (isUserComment(comment)) {
        userComments.push(comment)
      } else if (isLegacyComment(comment)) {
        userComments.push({
          message: {
            text: comment.data,
            messageId: comment.id,
          },
          timestamp: comment.timestamp,
          username: comment.user,
        } as UserComment)
      }
    } catch (error) {
      break
    }
  }

  return userComments
}

export async function readCommentsAsTree(options?: Options): Promise<CommentNode[]> {
  const userComments = await readComments(options)

  return commentListToTree(userComments)
}

export async function readCommentsAsync(options: Options): Promise<UserComment[]> {
  const { identifier, beeApiUrl, approvedFeedAddress: optionsAddress, startIx, endIx } = options
  if (startIx === undefined || endIx === undefined) {
    console.log('no start or end index - reading comments synchronously')
    return await readComments(options)
  }

  if (!identifier) {
    console.error('No identifier')
    return [] as UserComment[]
  }

  const bee = new Bee(beeApiUrl || BEE_URL)
  const address = optionsAddress || getAddressFromIdentifier(identifier)
  const feedReader = bee.makeFeedReader(DEFAULT_FEED_TYPE, identifier || ZeroHash, address)
  const userComments: UserComment[] = []

  try {
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
          console.log('Failed fetching feed update: ', result.reason)
        }
      })
    })

    await Promise.allSettled(dataPromises).then(results => {
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const comment = (result.value as Data).json()
          if (isUserComment(comment)) {
            userComments.push(comment)
          } else if (isLegacyComment(comment)) {
            userComments.push({
              message: {
                text: comment.data,
                messageId: comment.id,
              },
              timestamp: comment.timestamp,
              username: comment.user,
            } as UserComment)
          }
        } else {
          console.log('Failed fetching comment data: ', result.reason)
        }
      })
    })
  } catch (err) {
    console.error(`Error while reading comments from ${startIx} to ${endIx}: ${err}`)
    return [] as UserComment[]
  }

  userComments.sort((a, b) => a.timestamp - b.timestamp)

  return userComments
}

export async function readSingleComment(options: Options): Promise<SingleComment> {
  const { identifier, beeApiUrl, approvedFeedAddress: optionsAddress, startIx } = options
  if (!identifier) {
    console.error('No identifier')
    return {} as SingleComment
  }

  const bee = new Bee(beeApiUrl || BEE_URL)

  const address = optionsAddress || getAddressFromIdentifier(identifier)

  const feedReader = bee.makeFeedReader(DEFAULT_FEED_TYPE, identifier || ZeroHash, address)
  let userComment: UserComment
  let feedUpdate: FetchFeedUpdateResponse
  try {
    if (startIx !== undefined) {
      feedUpdate = await feedReader.download({ index: numberToFeedIndex(startIx) })
    } else {
      feedUpdate = await feedReader.download()
    }
    const data = await bee.downloadData(feedUpdate.reference)
    const comment = data.json()
    if (isUserComment(comment)) {
      userComment = comment
    } else if (isLegacyComment(comment)) {
      userComment = {
        message: {
          text: comment.data,
          messageId: comment.id,
        },
        timestamp: comment.timestamp,
        username: comment.user,
      } as UserComment
    } else {
      return {} as SingleComment
    }
  } catch (error) {
    console.error('Error while reading single comment: ', error)
    return {} as SingleComment
  }

  let nextIndex: number | undefined = undefined
  if (startIx === undefined) {
    try {
      nextIndex = makeNumericIndex(feedUpdate.feedIndexNext)
    } catch (err) {
      console.log('Error while getting next index: ', err)
      return {} as SingleComment
    }
  }

  return { comment: userComment, nextIndex: nextIndex }
}
