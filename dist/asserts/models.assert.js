import { isString } from './general.assert';
export function isComment(obj) {
    const { user, data } = (obj || {});
    return Boolean(isString(user) && isString(data));
}
