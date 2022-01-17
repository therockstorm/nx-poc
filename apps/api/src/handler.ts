import {
  ExecuteStatementCommand,
  RDSDataClient,
} from "@aws-sdk/client-rds-data";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { captureAWSv3Client } from "aws-xray-sdk-core";
import { envVar } from "core/src";
import Pino from "pino";

import { REGION } from "./constants";

const API_DB_CLUSTER_ARN = envVar("API_DB_CLUSTER_ARN");
const API_DB_SECRET_ARN = envVar("API_DB_SECRET_ARN");
const NANO_ID_REG_EX = /^[A-Za-z0-9_-]{21}$/;

const client = captureAWSv3Client(new RDSDataClient({ region: REGION }));
const logger = Pino({
  level: process.env["LOG_LEVEL"]
    ? process.env["LOG_LEVEL"]
    : process.env["NODE_ENV"] === "development"
    ? "trace"
    : "debug",
  redact: ["body"],
});

export async function handler(
  evt: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.debug(evt);

  if (evt.httpMethod === "POST") {
    if (!evt.body) return response(400, "Invalid request body.");

    try {
      const body: unknown = JSON.parse(evt.body);
      logger.info(`Received ${prettyJson(body)}`);
      return response(200, "OK.");
    } catch (error) {
      logger.error(error);
      return response(400, "Invalid body.");
    }
  }

  if (evt.httpMethod === "GET") {
    try {
      logger.info({
        validPathParam: NANO_ID_REG_EX.test(evt.pathParameters?.id ?? ""),
      });
      logger.info(
        (
          await client.send(
            new ExecuteStatementCommand({
              resourceArn: API_DB_CLUSTER_ARN,
              secretArn: API_DB_SECRET_ARN,
              sql: `SELECT * FROM test;`,
              database: "rocky",
            })
          )
        )?.records
      );
    } catch (error) {
      logger.error("Error calling DB.", error);
    }
    return response(200, "OK.");
  }

  return response(400, "Invalid request.");
}

function prettyJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

function response(statusCode: number, message: string): APIGatewayProxyResult {
  const res = { body: JSON.stringify({ message }), statusCode };
  logger.info(`Responding with ${prettyJson(res)}`);
  return res;
}

process.on("unhandledRejection", (e) => logger.error("unhandledRejection", e));
