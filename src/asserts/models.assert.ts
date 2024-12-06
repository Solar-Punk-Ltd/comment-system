import { Comment, UserComment } from "../model/comment.model"
import { isString } from "./general.assert"

export function isUserComment(obj: unknown): obj is UserComment {
  const { username, message } = (obj || {}) as UserComment
  const { text } = (message || {}) as Comment

  return Boolean(isString(username) && isString(text))
}
