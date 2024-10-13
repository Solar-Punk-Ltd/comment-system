import { Bee } from '@ethersphere/bee-js';
import { ZeroHash } from 'ethers';
import { v4 as uuid } from 'uuid';
import { BEE_URL } from './constants/constants';
import { getAddressFromIdentifier } from './utils/url';
import { isComment } from './asserts/models.assert';
import { numberToFeedIndex, feedIndexToNumber } from './utils/feeds';
import { commentListToTree } from './utils';
export async function writeComment(comment, options) {
    try {
        if (!options)
            return {};
        const { identifier, stamp, beeApiUrl, signer, tags } = options;
        if (!stamp)
            return {};
        const bee = new Bee(beeApiUrl || BEE_URL);
        const commentObject = Object.assign(Object.assign({}, comment), { id: comment.id || uuid(), timestamp: typeof comment.timestamp === 'number' ? comment.timestamp : new Date().getTime(), tags: tags || [] });
        const { reference } = await bee.uploadData(stamp, JSON.stringify(commentObject));
        console.log('Data upload successful: ', reference);
        console.log('Signer', signer);
        const feedWriter = bee.makeFeedWriter('sequence', identifier || ZeroHash, signer);
        console.log('feedWriter made: ', feedWriter);
        const r = await feedWriter.upload(stamp, reference);
        console.log('feed updated: ', r);
        return commentObject;
    }
    catch (error) {
        console.error('Error while writing comment: ', error);
        return {};
    }
}
export async function readComments(options) {
    if (!options)
        return [];
    const { identifier, beeApiUrl, approvedFeedAddress: optionsAddress, tags } = options;
    if (!identifier) {
        console.error('No identifier');
        return [];
    }
    const bee = new Bee(beeApiUrl || BEE_URL);
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
    if (tags && tags.length > 0) {
        return comments.filter(comment => tags.every(tag => { var _a; return (_a = comment.tags) === null || _a === void 0 ? void 0 : _a.includes(tag); }));
    }
    return comments;
}
export async function readCommentsAsTree(options) {
    const comments = await readComments(options);
    return commentListToTree(comments);
}
export async function readCommentsAsync(options) {
    const { identifier, beeApiUrl, approvedFeedAddress: optionsAddress, tags, startIx, endIx } = options;
    if (startIx === undefined || endIx === undefined) {
        console.log('no start or end index - reading comments synchronously');
        return await readComments(options);
    }
    if (!identifier) {
        console.error('No identifier');
        return [];
    }
    const bee = new Bee(beeApiUrl || BEE_URL);
    const address = optionsAddress || getAddressFromIdentifier(identifier);
    const feedReader = bee.makeFeedReader('sequence', identifier || ZeroHash, address);
    const comments = [];
    const actualStartIx = endIx > startIx ? startIx : endIx;
    const feedUpdatePromises = [];
    for (let i = actualStartIx; i <= endIx; i++) {
        feedUpdatePromises.push(feedReader.download({ index: numberToFeedIndex(i) }));
    }
    const dataPromises = [];
    await Promise.allSettled(feedUpdatePromises).then(results => {
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                dataPromises.push(bee.downloadData(result.value.reference));
            }
            else {
                console.log('error fetching feed update: ', result.reason);
            }
        });
    });
    await Promise.allSettled(dataPromises).then(results => {
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                const comment = result.value.json();
                if (isComment(comment)) {
                    comments.push(comment);
                }
            }
            else {
                console.log('error fetching comment data: ', result.reason);
            }
        });
    });
    comments.sort((a, b) => a.timestamp - b.timestamp);
    if (tags && tags.length > 0) {
        return comments.filter(comment => tags.every(tag => { var _a; return (_a = comment.tags) === null || _a === void 0 ? void 0 : _a.includes(tag); }));
    }
    return comments;
}
export async function readSingleComment(options) {
    const { identifier, beeApiUrl, approvedFeedAddress: optionsAddress, tags, startIx } = options;
    if (!identifier) {
        console.error('No identifier');
        return {};
    }
    const bee = new Bee(beeApiUrl || BEE_URL);
    const address = optionsAddress || getAddressFromIdentifier(identifier);
    const feedReader = bee.makeFeedReader('sequence', identifier || ZeroHash, address);
    let comment;
    let feedUpdate;
    try {
        if (startIx !== undefined) {
            feedUpdate = await feedReader.download({ index: numberToFeedIndex(startIx) });
        }
        else {
            feedUpdate = await feedReader.download();
        }
        const data = await bee.downloadData(feedUpdate.reference);
        const parsedData = data.json();
        if (isComment(parsedData)) {
            comment = parsedData;
        }
        else {
            console.log('object is not a comment');
            return {};
        }
    }
    catch (error) {
        console.error('Error while reading latest comment: ', error);
        return {};
    }
    const nextIndex = feedIndexToNumber(feedUpdate.feedIndexNext);
    if (tags && tags.length > 0) {
        return tags.every(tag => { var _a; return (_a = comment.tags) === null || _a === void 0 ? void 0 : _a.includes(tag); })
            ? { comment: comment, nextIndex: nextIndex }
            : {};
    }
    return { comment: comment, nextIndex: nextIndex };
}
