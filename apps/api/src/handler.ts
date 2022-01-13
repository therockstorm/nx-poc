import {
  BatchExecuteStatementCommand,
  RDSDataClient,
} from "@aws-sdk/client-rds-data";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { envVar } from "core/src";

import { REGION } from "./constants";

const client = new RDSDataClient({
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
  region: REGION,
});
const API_DB_CLUSTER_ARN = envVar("API_DB_CLUSTER_ARN");
const API_DB_SECRET_ARN = envVar("API_DB_SECRET_ARN");
const NANO_ID_REG_EX = /^[A-Za-z0-9_-]{21}$/;

// import LambdaApi, { Request } from "lambda-api";
// const api = LambdaApi();

// api.get("/users", async (req: Request) => {
//   try {
//     console.log(
//       req.pathParameters,
//       NANO_ID_REG_EX.test(req.pathParameters?.id ?? "")
//     );
//     const command = new BatchExecuteStatementCommand({
//       resourceArn: API_DB_CLUSTER_ARN,
//       secretArn: API_DB_SECRET_ARN,
//       sql: `SELECT * FROM test;`,
//       database: "rocky",
//     });
//     const data = await client.send(command);
//     console.log(data);
//   } catch (error) {
//     console.error("Error calling DB.", error);
//   }
//   return response(200, "OK.");
// });

// api.post("/users", (req: Request) => {
//   if (!req.body) return response(400, "Invalid request body.");

//   try {
//     const body: unknown = JSON.parse(req.body);
//     console.log(`Received ${prettyJson(body)}`);
//     return response(200, "OK.");
//   } catch (error) {
//     console.error(error);
//     return response(400, "Invalid body.");
//   }
// });

// export function handler(
//   evt: APIGatewayProxyEvent,
//   context: Context
// ): Promise<any> {
//   return api.run(evt, context);
// }

export async function handler(
  evt: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.debug(prettyJson(evt));

  if (evt.httpMethod === "POST") {
    if (!evt.body) return response(400, "Invalid request body.");

    try {
      const body: unknown = JSON.parse(evt.body);
      console.log(`Received ${prettyJson(body)}`);
      return response(200, "OK.");
    } catch (error) {
      console.error(error);
      return response(400, "Invalid body.");
    }
  }

  if (evt.httpMethod === "GET") {
    try {
      console.log(
        evt.pathParameters,
        NANO_ID_REG_EX.test(evt.pathParameters?.id ?? "")
      );
      console.log(
        await client.send(
          new BatchExecuteStatementCommand({
            resourceArn: API_DB_CLUSTER_ARN,
            secretArn: API_DB_SECRET_ARN,
            sql: `SELECT * FROM test;`,
            database: "rocky",
          })
        )
      );
    } catch (error) {
      console.error("Error calling DB.", error);
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
  console.log(`Responding with ${prettyJson(res)}`);
  return res;
}

process.on("unhandledRejection", (e) => console.error("unhandledRejection", e));
