import { envVar } from "core/src";

export const PROJECT = "api";

export const REGION = envVar("AWS_REGION");
