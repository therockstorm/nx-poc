import "source-map-support/register";

import {
  App,
  aws_apigateway as apigateway,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNodeJs,
  Duration,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { camelCase } from "camel-case";
import type { Construct } from "constructs";
import { envVar } from "lib/src";
import { join } from "path";
import { upperCaseFirst } from "upper-case-first";

import { Project, Region, Stage } from "../src/constants";

interface Name {
  readonly id: string;
  readonly name: string;
}

export class DeployStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const func = this.lambda("api", {
      entry: join(__dirname, "..", "src", "handler.ts"),
    });
    const names = this.stackResourceName(Project, "api");
    new apigateway.LambdaRestApi(this, names.id, { handler: func });
  }

  private lambda(
    name: string,
    args: lambdaNodeJs.NodejsFunctionProps
  ): lambdaNodeJs.NodejsFunction {
    const names = this.stackResourceName(name, "func", true);
    return new lambdaNodeJs.NodejsFunction(this, names.id, {
      bundling: { minify: true, sourceMap: true },
      environment: {
        STAGE: Stage,
        ...args.environment,
      },
      functionName: names.name,
      handler: "handle",
      logRetention: 7,
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: Duration.seconds(10),
      ...args,
    });
  }

  private stackResourceName(
    name: string,
    resource: string,
    addEnv = false
  ): Name {
    return {
      id: stackId(name, resource),
      name: `${name}-${this.region}${addEnv ? `-${Stage}` : ""}`,
    };
  }
}

function stackId(name: string, resource: string): string {
  return upperCaseFirst(`${camelCase(name)}${upperCaseFirst(resource)}`);
}

function main(): void {
  new DeployStack(new App(), "DeployStack", {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: Region ?? process.env.CDK_DEFAULT_REGION,
    },
    tags: {
      Creator: "cdk",
      Environment: Stage,
      Project: Project,
      Revision: envVar("GIT_SHORT_REV"),
    },
  });
}

main();
