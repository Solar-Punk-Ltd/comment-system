import { Bytes } from '@ethersphere/bee-js/dist/types/utils/bytes';
export declare function getIdentifierFromUrl(url: string): string | undefined;
export declare function getPrivateKeyFromIdentifier(identifier: string): Bytes<32>;
export declare function getPrivateKeyFromUrl(url: string): Bytes<32>;
export declare function getAddressFromIdentifier(identifier: string): string;
export declare function getAddressFromUrl(url: string): string;
