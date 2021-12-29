import { envVar } from "lib/src";

export const Project = "api";

export const Region = envVar("AWS_REGION");

export const Stage = envVar("STAGE");
