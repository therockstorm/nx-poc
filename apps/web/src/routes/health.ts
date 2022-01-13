import {
  ExecuteStatementCommand,
  RDSDataClient,
} from "@aws-sdk/client-rds-data";
import { envVar } from "core/src";

const API_DB_CLUSTER_ARN = envVar("API_DB_CLUSTER_ARN");
const API_DB_SECRET_ARN = envVar("API_DB_SECRET_ARN");

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get() {
  const client = new RDSDataClient({
    credentials: {
      accessKeyId: envVar("AWS_ID"),
      secretAccessKey: envVar("AWS_SECRET"),
    },
    region: "us-west-2",
  });
  console.log(
    (
      await client.send(
        new ExecuteStatementCommand({
          resourceArn: API_DB_CLUSTER_ARN,
          secretArn: API_DB_SECRET_ARN,
          //         sql: `
          // CREATE TABLE test
          // (
          //     id   INT PRIMARY KEY,
          //     name TEXT NOT NULL,
          //     age  INT  NOT NULL
          // );`,
          // sql: `INSERT INTO test (id,name,age) VALUES(1,'rocky',36)`,
          sql: `SELECT * FROM test;`,
          database: "rocky",
        })
      )
    ).records
  );
  return { body: { message: "Hello, api!" } };
}
