import { Bytes, EthAddress, PrivateKey } from "@ethersphere/bee-js";
import { Binary } from "cafe-utility";

import { PrivateKeyError } from "./errors";

/** Extracts path of a bzz link. For example:
    http://localhost:1633/bzz/<hash>/c/2023/development-updates/July.html =>
    <hash>/c/2023/development-updates/July.html
*/
const bzzPathRegex = /https?:\/\/.+\/bzz\/(.+)/;

export function getIdentifierFromBzzUrl(url: string): string | undefined {
  const result = bzzPathRegex.exec(url);

  return result && result[1] ? result[1] : undefined;
}

// creates a unique identifier from either a bzz or a random url by simply hashing it
export function getIdentifierFromUrl(url: string): string {
  const result = getIdentifierFromBzzUrl(url);
  if (result) {
    return result;
  }

  const idBytes = Binary.keccak256(Bytes.fromUtf8(url).toUint8Array());

  return new Bytes(idBytes).toString();
}

export function getPrivateKeyFromIdentifier(identifier: string): PrivateKey {
  if (!identifier) {
    throw new PrivateKeyError("Cannot generate private key from an invalid identifier");
  }

  const idBytes = Bytes.fromUtf8(identifier).toUint8Array();

  return new PrivateKey(Binary.keccak256(idBytes));
}

export function getPrivateKeyFromUrl(url: string): PrivateKey {
  const identifier = getIdentifierFromUrl(url);
  if (!identifier) {
    throw new PrivateKeyError("Cannot generate private key from an invalid url");
  }

  return getPrivateKeyFromIdentifier(identifier);
}

export function getAddressFromIdentifier(identifier: string): EthAddress {
  const privateKey = getPrivateKeyFromIdentifier(identifier);

  return privateKey.publicKey().address();
}

export function getAddressFromUrl(url: string): EthAddress {
  const privateKey = getPrivateKeyFromUrl(url);

  return privateKey.publicKey().address();
}
