import {
  BatchExecuteStatementCommand,
  RDSDataClient,
} from "@aws-sdk/client-rds-data";
import { envVar } from "core/src";

const API_DB_CLUSTER_ARN = envVar("API_DB_CLUSTER_ARN");
const API_DB_SECRET_ARN = envVar("API_DB_SECRET_ARN");

const client = new RDSDataClient({
  credentials: {
    accessKeyId: envVar("AWS_ID"),
    secretAccessKey: envVar("AWS_SECRET"),
  },
  region: "us-west-2",
});

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get() {
  //   await dataApi.query(`
  // CREATE TABLE test
  // (
  //     id   INT PRIMARY KEY,
  //     name TEXT NOT NULL,
  //     age  INT  NOT NULL
  // );`);
  // await dataApi.query(`INSERT INTO test (id,name,age) VALUES(:id,:name,:age)`, {
  //   id: 1,
  //   name: "Rocky",
  //   age: 36,
  // });

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
  return { body: { message: "Hello, api!" } };
}
