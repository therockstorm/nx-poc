export function thrw(err: string | Error): never {
  if (err instanceof Error) throw err;
  throw new Error(err);
}
