import produce from "immer";
import type { DeepReadonly, Opaque } from "ts-essentials";
import Pino from "pino";

const logger = Pino({
  level:
    process.env["LOG_LEVEL"] ?? process.env["NODE_ENV"] === "development"
      ? "trace"
      : "info",
  redact: ["secret"],
});
logger.info({ key: "myKey", secret: "mySecret" });

const child = logger.child({ file: "types" });
child.info("hello child!");

interface Name {
  first: string;
  last: string;
}

export type NameReadonly = DeepReadonly<Name>;

type PositiveNumber = Opaque<number, "PositiveNumber">;
export function makePositiveNumber(n: number): PositiveNumber {
  if (n <= 0) {
    throw new Error(`Value ${n} is not positive !`);
  }
  return n as PositiveNumber;
}

const baseState = [
  { title: "Learn TypeScript", done: true },
  { title: "Try Immer", done: false },
];

export const nextState = produce(baseState, (draftState) => {
  draftState.push({ title: "Tweet about it", done: false });
  draftState[1].done = true;
});
