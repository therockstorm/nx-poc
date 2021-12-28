import { required } from "./required";

export function envVar(name: string): string {
  return required(process.env[name], name) as string;
}
