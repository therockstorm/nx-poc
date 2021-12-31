import { envVar } from "lib/src";

export const PROJECT = "api";

export const REGION = envVar("AWS_REGION");

export const STAGE = envVar("STAGE");
