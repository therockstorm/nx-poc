import { thrw } from "./thrw";

export function required<T>(val: T, name: string): T | never {
  return val || thrw(`${name} required`);
}
