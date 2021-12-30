import "source-map-support/register";

import { Certbot } from "@renovosolutions/cdk-library-certbot";
import {
  App,
  aws_apigateway as apigateway,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNodeJs,
  Duration,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { camelCase } from "camel-case";
import type { Construct } from "constructs";
import { readFileSync } from "fs";
import { envVar } from "lib/src";
import { join } from "path";
import { upperCaseFirst } from "upper-case-first";

import { Project, Region, Stage } from "../src/constants";

interface Name {
  readonly id: string;
  readonly name: string;
}

const domain = "watchtower.dev";
declare const acmCertificate: any;

export class DeployStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const func = this.lambda("api", {
      entry: join(__dirname, "..", "src", "handler.ts"),
    });
    const apiNames = this.stackResourceName(Project, "api");
    const certNames = this.stackResourceName(Project, "cert");

    new Certbot(this, certNames.id, {
      letsencryptDomains: [`api.${domain}`].join(","),
      letsencryptEmail: "webmaster@rocky.dev",
      hostedZoneNames: [domain],
    });

    // TODO: https://github.com/aws/aws-cdk/issues/8347#issuecomment-651900511
    const spec = readFileSync(
      join(__dirname, "..", "..", "api-spec", "resolved.yml"),
      "utf8"
    );
    spec.replaceAll(
      "{{integrationUri}}",
      `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${func.functionArn}/invocations`
    );
    const role = iam.spec.replaceAll(
      "{{integrationCredentials}}",
      api.roleArn()
    );

    const api = new apigateway.SpecRestApi(this, apiNames.id, {
      apiDefinition: apigateway.ApiDefinition.fromAsset("path-to-file.yml"),
      domainName: {
        certificate: acmCertificate,
        domainName: `api.${domain}`,
      },
      failOnWarnings: true,
    });
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
