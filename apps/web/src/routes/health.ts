import aws from "aws-sdk";
import { envVar } from "core/src";
import DataApi from "data-api-client";

aws.config.update({
  credentials: {
    accessKeyId: envVar("AWS_ID"),
    secretAccessKey: envVar("AWS_SECRET"),
  },
  region: "us-west-2",
});

const dataApi = DataApi({
  database: "rocky",
  region: "us-west-2",
  resourceArn: envVar("AWS_CLUSTER_ARN"),
  secretArn: envVar("AWS_SECRET_ARN"),
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

  console.log(await dataApi.query(`SELECT * FROM test`));
  return { body: { message: "Hello, api!" } };
}
