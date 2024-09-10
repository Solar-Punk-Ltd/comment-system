import { Bee } from '@ethersphere/bee-js';
import { ZeroHash } from 'ethers';
import { getAddressFromIdentifier } from './uitls/url';
import { isComment } from './asserts/models.assert';
import { numberToFeedIndex } from './uitls/feeds';
export async function writeComment(comment, options) {
    try {
        if (!options)
            return;
        const { identifier, stamp, beeApiUrl, signer } = options;
        if (!stamp)
            return;
        //  const privateKey = optionsPrivateKey// || getPrivateKeyFromIdentifier(identifier) deprecated
        const bee = new Bee(beeApiUrl || "http://localhost:1633");
        const commentObject = Object.assign(Object.assign({}, comment), { timestamp: typeof comment.timestamp === 'number' ? comment.timestamp : new Date().getTime() });
        const { reference } = await bee.uploadData(stamp, JSON.stringify(commentObject));
        console.log("Data upload successful: ", reference);
        console.log("Signer", signer);
        const feedWriter = bee.makeFeedWriter('sequence', identifier || ZeroHash, signer);
        console.log("feedWriter made: ", feedWriter);
        const r = await feedWriter.upload(stamp, reference);
        console.log("feed updated: ", r);
        return commentObject;
    }
    catch (error) {
        console.error("Error while writing comment: ", error);
        return null;
    }
}
export async function readComments(options) {
    if (!options)
        return [];
    const { identifier, beeApiUrl, approvedFeedAddress: optionsAddress } = options;
    if (!identifier) {
        console.error("No identifier");
        return [];
    }
    const bee = new Bee(beeApiUrl || "http://localhost:1633");
    const address = optionsAddress || getAddressFromIdentifier(identifier);
    const feedReader = bee.makeFeedReader('sequence', identifier || ZeroHash, address);
    const comments = [];
    let nextIndex = 0;
    while (true) {
        try {
            const feedUpdate = await feedReader.download({ index: numberToFeedIndex(nextIndex++) });
            const data = await bee.downloadData(feedUpdate.reference);
            const comment = data.json();
            if (isComment(comment)) {
                comments.push(comment);
            }
        }
        catch (error) {
            break;
        }
    }
    return comments;
}