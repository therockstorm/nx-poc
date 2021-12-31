import "source-map-support/register";

import {
  App,
  aws_apigateway as apigateway,
  // aws_certificatemanager as acm,
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
import { load } from "js-yaml";
import { envVar } from "lib/src";
import { join } from "path";
import { upperCaseFirst } from "upper-case-first";

import { PROJECT, REGION, STAGE } from "../src/constants";

interface Name {
  readonly id: string;
  readonly name: string;
}

// const domain = "watchtower.dev";

export class DeployStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const func = this.lambda("api", {
      entry: join(__dirname, "..", "src", "handler.ts"),
    });

    const spec = readFileSync(
      join(__dirname, "..", "..", "api-spec", "resolved.yml"),
      "utf8"
    );
    spec.replaceAll(
      "{{integrationUri}}",
      `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${func.functionArn}/invocations`
    );
    const apiNames = this.stackResourceName(PROJECT, "openapi");
    // const certNames = this.stackResourceName(PROJECT, "cert");
    // const zoneNames = this.stackResourceName(Project, "hostedZone");
    // const hostedZone = new route53.HostedZone(this, zoneNames.id, {
    //   zoneName: domain,
    // });
    // const certificate = new acm.DnsValidatedCertificate(this, certNames.id, {
    //   domainName: `*.${domain}`,
    //   hostedZone,
    //   region: "us-east-1",
    // });
    const api = new apigateway.SpecRestApi(this, apiNames.id, {
      apiDefinition: apigateway.ApiDefinition.fromInline(load(spec)),
      deployOptions: { tracingEnabled: true },
      // domainName: {
      //   certificate,
      //   domainName: `api.${domain}`,
      //   endpointType: apigateway.EndpointType.EDGE,
      //   securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
      // },
      failOnWarnings: true,
    });

    func.grantInvoke(
      new iam.ServicePrincipal("apigateway.amazonaws.com").withConditions({
        ArnLike: { "aws:SourceArn": api.arnForExecuteApi() },
        StringEquals: { "aws:SourceAccount": this.account },
      })
    );
  }

  private lambda(
    name: string,
    args: lambdaNodeJs.NodejsFunctionProps
  ): lambdaNodeJs.NodejsFunction {
    const names = this.stackResourceName(name, "func", true);
    return new lambdaNodeJs.NodejsFunction(this, names.id, {
      bundling: { minify: true, sourceMap: true },
      environment: { STAGE: STAGE, ...args.environment },
      functionName: names.name,
      handler: "handle",
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
      logRetention: 7,
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: Duration.seconds(10),
      tracing: lambda.Tracing.ACTIVE,
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
      name: `${name}-${this.region}${addEnv ? `-${STAGE}` : ""}`,
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
      region: REGION ?? process.env.CDK_DEFAULT_REGION,
    },
    tags: {
      Creator: "cdk",
      Environment: STAGE,
      Project: PROJECT,
      Revision: envVar("GIT_SHORT_REV"),
    },
  });
}

main();
