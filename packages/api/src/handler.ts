import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export async function handle(
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

  if (evt.httpMethod === "GET") return response(200, "OK.");

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
