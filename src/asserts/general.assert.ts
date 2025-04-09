// TODO: import { Types } from 'cafe-utility'; etc...

export function isString(data: unknown): data is string {
  return typeof data === "string";
}

export function isBoolean(data: unknown): data is boolean {
  return typeof data === "boolean";
}

export function isNumber(data: unknown): data is boolean {
  return typeof data === "number";
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export function isStrictlyObject(value: unknown): value is Record<string, unknown> {
  return isObject(value) && !Array.isArray(value);
}
