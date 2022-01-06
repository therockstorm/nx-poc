import { envVar } from "@nx-poc/lib";

export const PROJECT = "api";

export const REGION = envVar("AWS_REGION");

export const STAGE = envVar("STAGE");
