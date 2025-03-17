import { Bytes } from "@ethersphere/bee-js";
import { Binary } from "cafe-utility";
import { hexlify, Wallet } from "ethers";

import { PrivateKeyError } from "./errors";

/** Extracts path of a bzz link. For example:
    http://localhost:1633/bzz/<hash>/c/2023/development-updates/July.html =>
    <hash>/c/2023/development-updates/July.html
*/
const bzzPathRegex = /https?:\/\/.+\/bzz\/(.+)/;

export function getIdentifierFromUrl(url: string): string | undefined {
  const result = bzzPathRegex.exec(url);

  return result && result[1] ? result[1] : undefined;
}

export function getPrivateKeyFromIdentifier(identifier: string): Bytes {
  if (!identifier) {
    throw new PrivateKeyError("Cannot generate private key from an invalid identifier");
  }

  const idBytes = Bytes.fromUtf8(identifier).toUint8Array();

  return new Bytes(Binary.keccak256(idBytes));
}

export function getPrivateKeyFromUrl(url: string): Bytes {
  const identifier = getIdentifierFromUrl(url);

  return getPrivateKeyFromIdentifier(identifier as string);
}

export function getAddressFromIdentifier(identifier: string): string {
  const privateKey = getPrivateKeyFromIdentifier(identifier);

  return new Wallet(hexlify(privateKey.toString())).address;
}

export function getAddressFromUrl(url: string): string {
  const privateKey = getPrivateKeyFromUrl(url);

  return new Wallet(hexlify(privateKey.toString())).address;
}
