import { UserComment } from "../src/model/comment.model"
import { HexString, Bytes } from "../src/utils/types"
import { Binary } from "cafe-utility"
import { Utils } from "@ethersphere/bee-js"

export const MOCK_STAMP = "7e5e5b232d7737eb99b82d22666da4771d4257cffd57cf762edd3fafc794c5a3"

export interface TestFixture {
  identifier: string
  comments: UserComment[]
}

export const getTestFixture = (): TestFixture => {
  const identifier = "1e4852d366b0c3266cb2097663e701571c7f9c72ab5ae6d7601bd013781eea0a"
  const fisrtComment = { username: "Xyz", message: { text: "Nice post" }, timestamp: 0 } as UserComment
  const secondComment = {
    username: "Abc",
    message: { text: "Typo in lorem ipsum" },
    timestamp: 1,
  } as UserComment

  return {
    identifier,
    comments: [fisrtComment, secondComment],
  }
}

export const testIdentity = {
  privateKey: "634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd" as HexString,
  publicKey: "03c32bb011339667a487b6c1c35061f15f7edc36aa9a0f8648aba07a4b8bd741b4" as HexString,
  address: "8d3766440f0d7b949a5e32995d09619a7f86e632" as HexString,
}
export const testJsonHash = "872a858115b8bee4408b1427b49e472883fdc2512d5a8f2d428b97ecc8f7ccfa"
export const testJsonPayload = [{ some: "object" }]
export const testJsonStringPayload = JSON.stringify(testJsonPayload)

export type EthAddress = Bytes<20>
export type Identifier = Bytes<32>
export const REFERENCE_BYTES_LENGTH = 32
export function makeSOCAddress(
  identifier: Identifier,
  address: EthAddress,
): Bytes<typeof REFERENCE_BYTES_LENGTH> {
  return Utils.keccak256Hash(identifier, address)
}

export const testChunkHash = "eb8da3795ea4f47b17d1b2740ace7ea0f97b85a8d1beb20e7902f48e79076bbc" as HexString
export const testChunkPayload = new Uint8Array([
  40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 103, 81, 229, 31, 50, 207, 203, 207, 98, 77, 106, 66, 225, 164, 233,
  213, 222, 119, 120, 13, 78, 150, 240, 183, 165, 150, 21, 27, 110, 13, 67, 100, 64, 7, 23, 128,
])

export const testChunkSpan = Binary.numberToUint64LE(testChunkPayload.length) as Bytes<8>

export const testChunkData = Buffer.from([
  218, 131, 246, 12, 137, 239, 242, 147, 29, 136, 163, 41, 55, 153, 17, 156, 165, 252, 198, 92, 227, 176, 180,
  118, 126, 169, 184, 1, 14, 154, 110, 40, 145, 165, 110, 134, 173, 11, 217, 15, 110, 146, 79, 130, 154, 12,
  140, 93, 53, 224, 236, 14, 237, 105, 200, 221, 77, 214, 143, 62, 87, 202, 151, 246, 76, 225, 40, 220, 140,
  216, 44, 216, 88, 158, 172, 35, 111, 183, 53, 220, 30, 90, 165, 217, 7, 87, 114, 19, 21, 197, 165, 211, 75,
  67, 57, 142, 27, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 103, 83, 54, 189, 133, 167, 89, 236, 172, 197, 49,
  204, 235, 54, 168, 94, 3, 194, 43, 182, 221, 254, 160, 249, 83, 193, 64, 7, 14, 65, 227, 164, 122, 27, 128,
  21,
])
