import { FeedIndex, PrivateKey, Reference } from "@ethersphere/bee-js";
import nock from "nock";

import { readComments, readCommentsInRange, readSingleComment, writeComment, writeCommentToIndex } from "../src/index";

import {
  assertAllIsDone,
  downloadDataMock,
  fetchChunkMock,
  MOCK_SERVER_URL,
  socPostMock,
  uploadDataMock,
} from "./nock";
import {
  feedIdentifier,
  MOCK_STAMP,
  mockComments,
  testChunkData1,
  testChunkData2,
  testChunkData3,
  testIdentity,
} from "./utils";

describe("Comments tests", () => {
  afterEach(() => nock.cleanAll());

  describe("Serial write and read", () => {
    it("should write and read a comment to a topic", async () => {
      const socIdentifier = "da83f60c89eff2931d88a3293799119ca5fcc65ce3b0b4767ea9b8010e9a6e28";
      const dataRef = "85a759ecacc531cceb36a85e03c22bb6ddfea0f953c140070e41e3a47a1b8015";
      const socReturnRef = "32cfcbcf624d6a42e1a4e9d5de77780d4e96f0b7a596151b6e0d436440071780";
      const notFoundDataRef = "a329fb22940eac881d5d95c86b0aacb3923b82db071b5ed78b15882ea3a109b0";
      const testChunkHash = "eb8da3795ea4f47b17d1b2740ace7ea0f97b85a8d1beb20e7902f48e79076bbc";

      uploadDataMock(MOCK_STAMP).reply(200, {
        reference: new Reference(dataRef).toString(),
      });
      socPostMock(MOCK_STAMP, testIdentity.address, socIdentifier).reply(200, {
        reference: new Reference(socReturnRef).toString(),
      });
      await writeComment(mockComments[0], {
        stamp: MOCK_STAMP,
        identifier: feedIdentifier,
        signer: new PrivateKey(testIdentity.privateKey),
        beeApiUrl: MOCK_SERVER_URL,
        address: testIdentity.address,
      });
      fetchChunkMock(testChunkHash).reply(200, testChunkData1);
      downloadDataMock(dataRef).reply(200, JSON.stringify(mockComments[0]));
      fetchChunkMock(notFoundDataRef).reply(404);
      const comments = await readComments({
        identifier: feedIdentifier,
        beeApiUrl: MOCK_SERVER_URL,
        address: testIdentity.address,
      });
      expect(comments?.map(c => c)).toStrictEqual([mockComments[0]]);

      assertAllIsDone();
    });
  });

  describe("Write to index and parallel read", () => {
    it("should write to specific indices and read them back async", async () => {
      const startIx = FeedIndex.fromBigInt(2n);
      const endIx = FeedIndex.fromBigInt(3n);
      const socIdentifier2 = "06fe94021fb32dc7415b488b8f59026bae4cfe3145471bd9318573d99b12c5e1";
      const socIdentifier3 = "687eb0ac11047efa8e8756f40799d053fef8c9e6f277cb7edeac28a09031f7ff";
      const newDataRef2 = "0f23cb00d87a43272deb2bacf1672dd6212c0dc6a1b3f2e93618c600f46a27d8";
      const newDataRef3 = "105f63f8013642e24f637e552fb6f85f64697ca4e0ae9037f268bd27e12a34ed";
      const socReturnRef2 = "32cfcbcf624d6a42e1a4e9d5de77780d4e96f0b7a596151b6e0d436440071780";
      const socReturnRef3 = "32cfcbcf624d6a42e1a4e9d5de77780d4e96f0b7a596151b6e0d436440071780";
      const testChunkHash2 = "33af2a8f48fbe86fc5d8a681836c828cd0a4354d15d2a3a7b5e570eede7f2367";
      const testChunkHash3 = "597270e86d1e21dafeef49239ca6d3c388b5636de1d3639214a70a5ad12d312f";

      uploadDataMock(MOCK_STAMP).reply(200, {
        reference: new Reference(newDataRef2).toString(),
      });
      socPostMock(MOCK_STAMP, testIdentity.address, socIdentifier2).reply(200, {
        reference: new Reference(socReturnRef2).toString(),
      });
      await writeCommentToIndex(mockComments[0], startIx, {
        stamp: MOCK_STAMP,
        identifier: feedIdentifier,
        signer: new PrivateKey(testIdentity.privateKey),
        beeApiUrl: MOCK_SERVER_URL,
        address: testIdentity.address,
      });
      uploadDataMock(MOCK_STAMP).reply(200, {
        reference: new Reference(newDataRef3).toString(),
      });
      socPostMock(MOCK_STAMP, testIdentity.address, socIdentifier3).reply(200, {
        reference: new Reference(socReturnRef3).toString(),
      });
      await writeCommentToIndex(mockComments[1], endIx, {
        stamp: MOCK_STAMP,
        identifier: feedIdentifier,
        signer: new PrivateKey(testIdentity.privateKey),
        address: testIdentity.address,
        beeApiUrl: MOCK_SERVER_URL,
      });
      fetchChunkMock(testChunkHash2).reply(200, testChunkData2);
      downloadDataMock(newDataRef2).reply(200, JSON.stringify(mockComments[0]));
      fetchChunkMock(testChunkHash3).reply(200, testChunkData3);
      downloadDataMock(newDataRef3).reply(200, JSON.stringify(mockComments[1]));
      const comments = await readCommentsInRange(startIx, endIx, {
        identifier: feedIdentifier,
        address: testIdentity.address,
        beeApiUrl: MOCK_SERVER_URL,
      });

      expect(comments?.map(c => c)).toStrictEqual(mockComments);

      assertAllIsDone();
    });
  });

  describe("Write to and index and read that single comment", () => {
    it("should write and read a single comment with lookup", async () => {
      const startIx = FeedIndex.fromBigInt(0n);
      const socIdentifier0 = "da83f60c89eff2931d88a3293799119ca5fcc65ce3b0b4767ea9b8010e9a6e28";
      const newDataRef0 = "85a759ecacc531cceb36a85e03c22bb6ddfea0f953c140070e41e3a47a1b8015";
      const socReturnRef0 = "eb8da3795ea4f47b17d1b2740ace7ea0f97b85a8d1beb20e7902f48e79076bbc";
      const testChunkHash0 = "eb8da3795ea4f47b17d1b2740ace7ea0f97b85a8d1beb20e7902f48e79076bbc";

      uploadDataMock(MOCK_STAMP).reply(200, {
        reference: new Reference(newDataRef0).toString(),
      });
      socPostMock(MOCK_STAMP, testIdentity.address, socIdentifier0).reply(200, {
        reference: new Reference(socReturnRef0).toString(),
      });
      await writeCommentToIndex(mockComments[0], startIx, {
        stamp: MOCK_STAMP,
        identifier: feedIdentifier,
        signer: new PrivateKey(testIdentity.privateKey),
        beeApiUrl: MOCK_SERVER_URL,
        address: testIdentity.address,
      });
      fetchChunkMock(testChunkHash0).reply(200, testChunkData1);
      downloadDataMock(newDataRef0).reply(200, JSON.stringify(mockComments[0]));
      const comment = await readSingleComment(startIx, {
        identifier: feedIdentifier,
        address: testIdentity.address,
        beeApiUrl: MOCK_SERVER_URL,
      });

      expect([comment]).toStrictEqual([{ message: mockComments[0], nextIndex: FeedIndex.fromBigInt(1n).toString() }]);

      assertAllIsDone();
    });
  });
});
