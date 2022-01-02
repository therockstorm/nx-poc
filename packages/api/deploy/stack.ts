import "source-map-support/register";

import {
  App,
  aws_apigateway as apigateway,
  aws_ec2 as ec2,
  // aws_certificatemanager as acm,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNodeJs,
  aws_rds as rds,
  Duration,
  RemovalPolicy,
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

    const vpc = new ec2.Vpc(this, "Vpc", {
      cidr: "10.0.0.0/16",
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "private-isolated-1",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });
    vpc.addInterfaceEndpoint("sm", {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });
    vpc.addInterfaceEndpoint("rds", {
      service: ec2.InterfaceVpcEndpointAwsService.RDS_DATA,
    });
    const cluster = new rds.ServerlessCluster(this, "AuroraServerless", {
      defaultDatabaseName: "rocky",
      enableDataApi: true,
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        "ParameterGroup",
        "default.aurora-postgresql10"
      ),
      removalPolicy: RemovalPolicy.RETAIN,
      scaling: {
        autoPause: Duration.minutes(5),
        minCapacity: rds.AuroraCapacityUnit.ACU_2,
        maxCapacity: rds.AuroraCapacityUnit.ACU_2,
      },
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });
    const secret = cluster.node.children.filter(
      (child) => child instanceof rds.DatabaseSecret
    )[0] as rds.DatabaseSecret;

    const func = this.lambda({
      name: "api",
      args: {
        entry: join(__dirname, "..", "src", "handler.ts"),
        environment: {
          DB_ARN: cluster.clusterArn,
          DB_SECRET_ARN: secret.secretArn,
        },
      },
    });

    const spec = readFileSync(
      join(__dirname, "..", "..", "api-spec", "resolved.yml"),
      "utf8"
    );
    const integrationArn = `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${func.functionArn}/invocations`;
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
      apiDefinition: apigateway.ApiDefinition.fromInline(
        load(spec.replaceAll("{{integrationUri}}", integrationArn))
      ),
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
    cluster.grantDataApiAccess(func);
  }

  private lambda({
    name,
    args,
  }: {
    name: string;
    args: lambdaNodeJs.NodejsFunctionProps;
  }): lambdaNodeJs.NodejsFunction {
    const names = this.stackResourceName(name, "func", true);
    return new lambdaNodeJs.NodejsFunction(this, names.id, {
      bundling: { minify: true, sourceMap: true },
      functionName: names.name,
      handler: "handle",
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
      logRetention: 7,
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: Duration.seconds(10),
      tracing: lambda.Tracing.ACTIVE,
      ...args,
      environment: { STAGE: STAGE, ...args.environment },
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
