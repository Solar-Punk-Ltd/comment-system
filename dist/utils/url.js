import { Utils } from '@ethersphere/bee-js';
import { Wallet, hexlify } from 'ethers';
/** Extracts path of a bzz link. For example:
    http://localhost:1633/bzz/<hash>/c/2023/development-updates/July.html =>
    <hash>/c/2023/development-updates/July.html
*/
const bzzPathRegex = /https?:\/\/.+\/bzz\/(.+)/;
export function getIdentifierFromUrl(url) {
    const result = bzzPathRegex.exec(url);
    return result && result[1] ? result[1] : undefined;
}
export function getPrivateKeyFromIdentifier(identifier) {
    if (!identifier) {
        throw new Error('Cannot generate private key from an invalid identifier');
    }
    return Utils.keccak256Hash(identifier);
}
export function getPrivateKeyFromUrl(url) {
    const identifier = getIdentifierFromUrl(url);
    return getPrivateKeyFromIdentifier(identifier);
}
export function getAddressFromIdentifier(identifier) {
    const privateKey = getPrivateKeyFromIdentifier(identifier);
    return new Wallet(hexlify(privateKey)).address;
}
export function getAddressFromUrl(url) {
    const privateKey = getPrivateKeyFromUrl(url);
    return new Wallet(hexlify(privateKey)).address;
}
