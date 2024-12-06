import nock from "nock"
import { writeComment, readComments, writeCommentToIndex, readCommentsAsync } from "../src/index"
import {
  MOCK_SERVER_URL,
  assertAllIsDone,
  downloadDataMock,
  fetchFeedUpdateMock,
  uploadDataMock,
  socPostMock,
  fetchChunkMock,
} from "./nock"
import { MOCK_STAMP, getTestFixture, testIdentity, testChunkHash, testChunkData } from "./utils"
import { ReferenceResponse } from "@ethersphere/bee-js"
import { ethers } from "ethers"

export const generateSignature = async (privateKey: string, data: Uint8Array): Promise<string> => {
  const wallet = new ethers.Wallet(privateKey)
  const messageHash = ethers.hashMessage(data)
  const signature = await wallet.signMessage(messageHash)
  return signature
}

describe("Comments tests", () => {
  afterEach(() => nock.cleanAll())
  // TODO: get proper usercomment hash data
  describe("Syncronous write and read", () => {
    it("should write and read two comments to an url", async () => {
      const { identifier, comments: expComments } = getTestFixture()
      const socIdentifier = "da83f60c89eff2931d88a3293799119ca5fcc65ce3b0b4767ea9b8010e9a6e28"
      fetchFeedUpdateMock(testIdentity.address, identifier).reply(404)
      uploadDataMock(MOCK_STAMP).reply(200, {
        reference: "32cfcbcf624d6a42e1a4e9d5de77780d4e96f0b7a596151b6e0d436440071780",
      } as ReferenceResponse)
      socPostMock(MOCK_STAMP, testIdentity.address, socIdentifier).reply(200, {
        reference: "32cfcbcf624d6a42e1a4e9d5de77780d4e96f0b7a596151b6e0d436440071780",
      } as ReferenceResponse)
      await writeComment(expComments[0], {
        stamp: MOCK_STAMP,
        identifier: identifier,
        signer: testIdentity.privateKey,
        beeApiUrl: MOCK_SERVER_URL,
        approvedFeedAddress: testIdentity.address,
      })
      fetchChunkMock(testChunkHash).reply(200, testChunkData)
      downloadDataMock("85a759ecacc531cceb36a85e03c22bb6ddfea0f953c140070e41e3a47a1b8015").reply(
        200,
        JSON.stringify("random"),
      )
      fetchChunkMock("a329fb22940eac881d5d95c86b0aacb3923b82db071b5ed78b15882ea3a109b0").reply(404)
      const comments = await readComments({
        identifier: identifier,
        beeApiUrl: MOCK_SERVER_URL,
        approvedFeedAddress: testIdentity.address,
      })
      expect(comments.map(({ username, message }) => ({ username, message }))).toStrictEqual([
        {
          username: expComments[0].username,
          message: expComments[0].message,
          timestamp: expComments[0].timestamp,
        },
      ])
    })

    assertAllIsDone()
  })
  // TODO: finish async test
  describe("Asyncronous write and read", () => {
    it("should write to specific indices and read them back async", async () => {
      const { identifier, comments: expComments } = getTestFixture()
      const startIx = 2
      const endIx = 3
      await writeCommentToIndex(expComments[0], {
        stamp: MOCK_STAMP,
        identifier,
        signer: testIdentity.privateKey,
        beeApiUrl: MOCK_SERVER_URL,
        approvedFeedAddress: testIdentity.address,
        startIx,
      })
      await writeCommentToIndex(expComments[1], {
        stamp: MOCK_STAMP,
        identifier,
        signer: testIdentity.privateKey,
        approvedFeedAddress: testIdentity.address,
        beeApiUrl: MOCK_SERVER_URL,
        startIx: endIx,
      })
      const comments = await readCommentsAsync({
        identifier,
        approvedFeedAddress: testIdentity.address,
        beeApiUrl: MOCK_SERVER_URL,
        startIx,
        endIx,
      })

      expect(comments.map(({ username, message }) => ({ username, message }))).toStrictEqual([
        expComments[0],
        expComments[1],
      ])
    })
  })
})
