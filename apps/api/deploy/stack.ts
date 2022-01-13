import "source-map-support/register";

import {
  App,
  aws_apigateway as apigateway,
  aws_cloudwatch as cloudwatch,
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
import { envVar } from "core/src";
import { readFileSync } from "fs";
import { load } from "js-yaml";
import { join } from "path";
import { upperCaseFirst } from "upper-case-first";

import { PROJECT as API_PROJECT } from "../src/constants";

interface Name {
  readonly id: string;
  readonly name: string;
}

interface ApiStackProps extends StackProps {
  readonly vpc: ec2.IVpc;
  // readonly auroraServerlessSecurityGroup: ec2.SecurityGroup;
}

const GH_USER = "therockstorm";
const GH_REPO = "nx-poc";
// const DOMAIN = "watchtower.dev";

export class OpsStack extends Stack {
  public readonly vpc: ec2.Vpc;
  // public readonly auroraServerlessSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "Vpc", {
      cidr: "10.0.0.0/16",
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        // {
        //   cidrMask: 24,
        //   name: "bastion",
        //   subnetType: ec2.SubnetType.PUBLIC,
        // },
        {
          cidrMask: 24,
          name: "private-isolated-1",
          // name: "aurora-serverless",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });
    // const bastionHost = new ec2.BastionHostLinux(
    //   this,
    //   resourceId({ name: "bastion", resource: "ec2" }),
    //   {
    //     vpc: this.vpc,
    //     subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
    //   }
    // );
    // this.auroraServerlessSecurityGroup = new ec2.SecurityGroup(
    //   this,
    //   resourceId({ name: "bastion", resource: "securityGroup" }),
    //   {
    //     vpc: this.vpc,
    //     description: "Allow access to RDS.",
    //     allowAllOutbound: true,
    //   }
    // );
    // this.auroraServerlessSecurityGroup.addIngressRule(
    //   bastionHost.instance.connections.securityGroups[0],
    //   ec2.Port.tcp(5432),
    //   "Allows PostgreSQL connections from bastion security group."
    // );
    this.vpc.addInterfaceEndpoint(
      resourceId({ name: "secretsManager", resource: "interfaceEndpoint" }),
      { service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER }
    );
    this.vpc.addInterfaceEndpoint(
      resourceId({ name: "rds", resource: "interfaceEndpoint" }),
      { service: ec2.InterfaceVpcEndpointAwsService.RDS_DATA }
    );

    // See https://benoitboure.com/securely-access-your-aws-resources-from-github-actions
    const providerName = resourceName({
      name: "GitHub",
      resource: "OpenIdConnectProvider",
    });
    const provider = new iam.OpenIdConnectProvider(this, providerName.id, {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
      thumbprints: ["a031c46782e6e6c662c2c87c76da9aa62ccabd8e"],
    });
    const roleName = resourceName({
      name: "GitHub",
      resource: "role",
    });
    new iam.Role(this, roleName.name, {
      assumedBy: new iam.OpenIdConnectPrincipal(provider).withConditions({
        StringLike: {
          "token.actions.githubusercontent.com:sub": `repo:${GH_USER}/${GH_REPO}:*`,
        },
      }),
      inlinePolicies: {
        // https://stackoverflow.com/a/61102280
        "assumeRole-allow-cdk": new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["sts:AssumeRole"],
              effect: iam.Effect.ALLOW,
              resources: ["arn:aws:iam::*:role/cdk-*"],
            }),
            new iam.PolicyStatement({
              actions: ["cloudformation:*"],
              effect: iam.Effect.ALLOW,
              resources: ["*"],
            }),
          ],
        }),
      },
    });

    // const certName = stackResourceName(PROJECT, "cert");
    // const zoneName = stackResourceName(Project, "hostedZone");
    // const hostedZone = new route53.HostedZone(this, zoneName.id, {
    //   zoneName: DOMAIN,
    // });
    // const certificate = new acm.DnsValidatedCertificate(this, certName.id, {
    //   domainName: `*.${DOMAIN}`,
    //   hostedZone,
    //   region: "us-east-1",
    // });
  }
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: ApiStackProps) {
    super(scope, id, props);
    if (props == null) throw new Error("Invalid props.");

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
      // securityGroups: [props.auroraServerlessSecurityGroup],
      scaling: {
        autoPause: Duration.minutes(5),
        minCapacity: rds.AuroraCapacityUnit.ACU_2,
        maxCapacity: rds.AuroraCapacityUnit.ACU_2,
      },
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });
    const secret = cluster.node.children.filter(
      (child) => child instanceof rds.DatabaseSecret
    )[0] as rds.DatabaseSecret;

    const func = lambdaFunc({
      args: {
        entry: join(__dirname, "..", "src", "handler.ts"),
        environment: {
          DB_ARN: cluster.clusterArn,
          DB_SECRET_ARN: secret.secretArn,
        },
      },
      name: "api",
      scope: this,
    });

    // const ddbPolicyName = stackResourceName("DynamoDbRW", "Policy");
    // new iam.ManagedPolicy(this, ddbPolicyName.id, {
    //   managedPolicyName: ddbPolicyName.name,
    //   statements: [
    //     new iam.PolicyStatement({
    //       effect: iam.Effect.ALLOW,
    //       actions: [
    //         "dynamodb:PutItem",
    //         "dynamodb:UpdateItem",
    //         "dynamodb:DeleteItem",
    //         "dynamodb:BatchWriteItem",
    //         "dynamodb:GetItem",
    //         "dynamodb:BatchGetItem",
    //         "dynamodb:Scan",
    //         "dynamodb:Query",
    //         "dynamodb:ConditionCheckItem",
    //       ],
    //       resources: [
    //         "arn:aws:dynamodb:us-west-2:123456789012:table/XXX",
    //         "arn:aws:dynamodb:us-west-2:123456789012:table/XXX/index/*",
    //       ],
    //     }),
    //   ],
    // });

    const auroraRWPolicyName = resourceName({
      name: "AuroraRW",
      resource: "Policy",
    });
    const auroraRWPolicy = new iam.ManagedPolicy(this, auroraRWPolicyName.id, {
      managedPolicyName: auroraRWPolicyName.name,
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "rds-data:ExecuteSql",
            "rds-data:ExecuteStatement",
            "rds-data:BatchExecuteStatement",
            "rds-data:BeginTransaction",
            "rds-data:RollbackTransaction",
            "rds-data:CommitTransaction",
          ],
          resources: [cluster.clusterArn],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["secretsmanager:GetSecretValue"],
          resources: [secret.secretArn],
        }),
      ],
    });
    const auroraRWUserName = resourceName({
      name: "AuroraRW",
      resource: "user",
    });
    new iam.User(this, auroraRWUserName.id).addManagedPolicy(auroraRWPolicy);

    const spec = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "..",
        "libs",
        "api-spec",
        "resolved",
        "openapi",
        "openapi.yaml"
      ),
      "utf8"
    );
    const integrationArn = `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${func.functionArn}/invocations`;
    const apiName = resourceName({
      name: API_PROJECT,
      resource: "openapi",
    });
    const api = new apigateway.SpecRestApi(this, apiName.id, {
      apiDefinition: apigateway.ApiDefinition.fromInline(
        load(spec.replaceAll("{{integrationUri}}", integrationArn))
      ),
      deployOptions: { tracingEnabled: true },
      // domainName: {
      //   certificate,
      //   domainName: `api.${DOMAIN}`,
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
}

function lambdaFunc({
  args,
  name,
  scope,
}: {
  args: lambdaNodeJs.NodejsFunctionProps;
  name: string;
  scope: Construct;
}): lambdaNodeJs.NodejsFunction {
  const rName = resourceName({ name, resource: "func" });
  const func = new lambdaNodeJs.NodejsFunction(scope, rName.id, {
    bundling: { minify: true, sourceMap: true },
    functionName: rName.name,
    insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
    logRetention: 7,
    reservedConcurrentExecutions: 10,
    runtime: lambda.Runtime.NODEJS_14_X,
    timeout: Duration.seconds(30),
    tracing: lambda.Tracing.ACTIVE,
    ...args,
  });

  if (func.timeout) {
    const timeoutAlarmName = resourceName({ name, resource: "timeoutAlarm" });
    new cloudwatch.Alarm(scope, timeoutAlarmName.id, {
      alarmName: timeoutAlarmName.name,
      evaluationPeriods: 1,
      metric: func.metricDuration().with({ statistic: "Maximum" }),
      treatMissingData: cloudwatch.TreatMissingData.IGNORE,
      threshold: func.timeout.toMilliseconds(),
    });
  }

  const errorAlarmName = resourceName({ name, resource: "errorAlarm" });
  new cloudwatch.Alarm(scope, errorAlarmName.id, {
    alarmName: errorAlarmName.name,
    evaluationPeriods: 1,
    metric: func.metricErrors({ period: Duration.minutes(1) }),
    treatMissingData: cloudwatch.TreatMissingData.IGNORE,
    threshold: 1,
  });

  return func;
}

function resourceName({
  name,
  region,
  resource,
}: {
  name: string;
  region?: string;
  resource: string;
}): Name {
  return {
    id: resourceId({ name, resource }),
    name: `${name}${region != null ? `-${region}` : ""}`,
  };
}

function resourceId({
  name,
  resource,
}: {
  name: string;
  resource: string;
}): string {
  return upperCaseFirst(`${camelCase(name)}${upperCaseFirst(resource)}`);
}

function main(): void {
  const app = new App();
  const region = process.env.CDK_DEFAULT_REGION;

  const opsName = resourceName({ name: "ops", region, resource: "stack" });
  const ops = new OpsStack(app, opsName.id, {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
    tags: {
      StackName: opsName.name,
      Project: "ops",
      Revision: envVar("GIT_SHORT_REV"),
    },
  });

  const apiId = resourceName({ name: "api", region, resource: "stack" });
  new ApiStack(app, apiId.id, {
    // auroraServerlessSecurityGroup: ops.auroraServerlessSecurityGroup,
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
    tags: {
      StackName: apiId.name,
      Project: API_PROJECT,
      Revision: envVar("GIT_SHORT_REV"),
    },
    vpc: ops.vpc,
  });
}

main();
