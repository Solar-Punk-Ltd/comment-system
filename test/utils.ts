import { NULL_ADDRESS, Reference } from "@ethersphere/bee-js";

import { MessageData, MessageType } from "../src/model/comment.model";

export const SWARM_ZERO_ADDRESS = new Reference(NULL_ADDRESS);
export const BEE_URL = "http://127.0.0.1:1633";
export const MOCK_STAMP = "89fe1213a9b922425e3894159a04dc7adbadcf52d8d14a1005700f6cd691740d";
export const user1 = { username: "Xyz", address: "8d3766440f0d7b949a5e32995d09619a7f86e632" };
export const user2 = { username: "Abc", address: "1d3766440f0d7b949a5e32995d09619a7f86e632" };
export const mockComments: MessageData[] = [
  {
    username: user1.username,
    message: "Nice post",
    timestamp: 0,
    type: MessageType.TEXT,
    id: "00",
    index: 0,
    topic: "chat1",
    address: user1.address,
  },
  {
    username: user2.username,
    message: "Typo in lorem ipsum",
    timestamp: 1,
    type: MessageType.TEXT,
    id: "01",
    index: 1,
    topic: "chat1",
    address: user2.address,
  },
];
export const mockReactions: MessageData[] = [
  {
    username: user1.username,
    address: user1.address,
    message: "like",
    type: MessageType.REACTION,
    targetMessageId: "00",
    id: "0",
    timestamp: 0,
    topic: "chat1",
    index: 0,
  },
  {
    username: user2.username,
    address: user2.address,
    message: "dislike",
    type: MessageType.REACTION,
    targetMessageId: "00",
    id: "1",
    timestamp: 1,
    topic: "chat1",
    index: 1,
  },
];
export const testIdentity = {
  privateKey: "634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd",
  publicKey: "03c32bb011339667a487b6c1c35061f15f7edc36aa9a0f8648aba07a4b8bd741b4",
  address: "8d3766440f0d7b949a5e32995d09619a7f86e632",
};
export const feedIdentifier = "1e4852d366b0c3266cb2097663e701571c7f9c72ab5ae6d7601bd013781eea0a";
export const testChunkIdentifier = new Uint8Array([
  218, 131, 246, 12, 137, 239, 242, 147, 29, 136, 163, 41, 55, 153, 17, 156, 165, 252, 198, 92, 227, 176, 180, 118, 126,
  169, 184, 1, 14, 154, 110, 40,
]);
export const testChunkSignature = new Uint8Array([
  145, 165, 110, 134, 173, 11, 217, 15, 110, 146, 79, 130, 154, 12, 140, 93, 53, 224, 236, 14, 237, 105, 200, 221, 77,
  214, 143, 62, 87, 202, 151, 246, 76, 225, 40, 220, 140, 216, 44, 216, 88, 158, 172, 35, 111, 183, 53, 220, 30, 90,
  165, 217, 7, 87, 114, 19, 21, 197, 165, 211, 75, 67, 57, 142, 27,
]);
export const testChunkSpan = new Uint8Array([40, 0, 0, 0, 0, 0, 0, 0]);
export const testChunkPayload = new Uint8Array([
  0, 0, 0, 0, 103, 83, 54, 189, 133, 167, 89, 236, 172, 197, 49, 204, 235, 54, 168, 94, 3, 194, 43, 182, 221, 254, 160,
  249, 83, 193, 64, 7, 14, 65, 227, 164, 122, 27, 128, 21,
]);
// only buffer works with data download in chunks get
export const testChunkData1 = Buffer.from([
  ...testChunkIdentifier,
  ...testChunkSignature,
  ...testChunkSpan,
  ...testChunkPayload,
]);
// 06fe94021fb32dc7415b488b8f59026bae4cfe3145471bd9318573d99b12c5e1e6ff4ed75a3b28c7742baadc90e802ce0623d804ac0e4c44e50f2f7a0bf4dc2c31e9a95976a2b345b63000e9caf6d481c364bf51d65bf5dbf0d646252248f09a1b280000000000000000000000675468390f23cb00d87a43272deb2bacf1672dd6212c0dc6a1b3f2e93618c600f46a27d8
export const testChunkData2 = Buffer.from([
  6, 254, 148, 2, 31, 179, 45, 199, 65, 91, 72, 139, 143, 89, 2, 107, 174, 76, 254, 49, 69, 71, 27, 217, 49, 133, 115,
  217, 155, 18, 197, 225, 230, 255, 78, 215, 90, 59, 40, 199, 116, 43, 170, 220, 144, 232, 2, 206, 6, 35, 216, 4, 172,
  14, 76, 68, 229, 15, 47, 122, 11, 244, 220, 44, 49, 233, 169, 89, 118, 162, 179, 69, 182, 48, 0, 233, 202, 246, 212,
  129, 195, 100, 191, 81, 214, 91, 245, 219, 240, 214, 70, 37, 34, 72, 240, 154, 27, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 103, 84, 104, 57, 15, 35, 203, 0, 216, 122, 67, 39, 45, 235, 43, 172, 241, 103, 45, 214, 33, 44, 13, 198, 161, 179,
  242, 233, 54, 24, 198, 0, 244, 106, 39, 216,
]);
// 687eb0ac11047efa8e8756f40799d053fef8c9e6f277cb7edeac28a09031f7ff036d693e0e5c529ad4dd5bf56171ed42913b4b86e0fcab3e84d2beb6b0d7d83d74e77afeafd8eed9f48de8dbb950b3bf8af793e2720d64714e96b2a3707cbba91c28000000000000000000000067546839105f63f8013642e24f637e552fb6f85f64697ca4e0ae9037f268bd27e12a34ed
export const testChunkData3 = Buffer.from([
  104, 126, 176, 172, 17, 4, 126, 250, 142, 135, 86, 244, 7, 153, 208, 83, 254, 248, 201, 230, 242, 119, 203, 126, 222,
  172, 40, 160, 144, 49, 247, 255, 3, 109, 105, 62, 14, 92, 82, 154, 212, 221, 91, 245, 97, 113, 237, 66, 145, 59, 75,
  134, 224, 252, 171, 62, 132, 210, 190, 182, 176, 215, 216, 61, 116, 231, 122, 254, 175, 216, 238, 217, 244, 141, 232,
  219, 185, 80, 179, 191, 138, 247, 147, 226, 114, 13, 100, 113, 78, 150, 178, 163, 112, 124, 187, 169, 28, 40, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 103, 84, 104, 57, 16, 95, 99, 248, 1, 54, 66, 226, 79, 99, 126, 85, 47, 182, 248, 95, 100,
  105, 124, 164, 224, 174, 144, 55, 242, 104, 189, 39, 225, 42, 52, 237,
]);
