import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

// ========== New: Import ApiKey, UsagePlan, and Period ==========
import { RestApi, LambdaIntegration, ApiKey, UsagePlan, Period } from 'aws-cdk-lib/aws-apigateway';

export class AwsCdkTranslationApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a DynamoDB table
    const table = new Table(this, 'MyApiTable', {
      tableName: 'MyApiTable',
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    new CfnOutput(this, 'TableNameOutput', {
      value: table.tableName,
    });

    // Create Lambda function for GET /things
    const getAllItemsFunction = new NodejsFunction(this, 'GetAllItemsFunction', {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, '..', 'lambdas', 'getAllItems.ts'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadWriteData(getAllItemsFunction);

    // Create Lambda function for POST /things
    const createItemFunction = new NodejsFunction(this, 'CreateItemFunction', {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, '..', 'lambdas', 'createItem.ts'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadWriteData(createItemFunction);

    // Create Lambda function for GET /things/{partitionKey}
    const getItemsByPartitionFunction = new NodejsFunction(this, 'GetItemsByPartitionFunction', {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, '..', 'lambdas', 'getItemsByPartition.ts'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadWriteData(getItemsByPartitionFunction);

    // Create Lambda function for PUT /things/{partitionKey}/{sortKey}
    const updateItemFunction = new NodejsFunction(this, 'UpdateItemFunction', {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, '..', 'lambdas', 'updateItem.ts'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadWriteData(updateItemFunction);

    // Create Lambda function for GET /things/{partitionKey}/{sortKey}/translation
    const translateItemFunction = new NodejsFunction(this, 'TranslateItemFunction', {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, '..', 'lambdas', 'translateItem.ts'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadWriteData(translateItemFunction);
    translateItemFunction.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'translate:*',
          'comprehend:DetectDominantLanguage'
        ],
        resources: ['*'],
      })
    );

    // Create and configure an API Gateway
    const api = new RestApi(this, 'AppApi', {
      restApiName: 'ThingsService',
    });

    const things = api.root.addResource('things');

    // GET /things
    things.addMethod('GET', new LambdaIntegration(getAllItemsFunction));

    // Secure POST /things with API Key (only one POST method is defined)
    const postMethod = things.addMethod('POST', new LambdaIntegration(createItemFunction), {
      apiKeyRequired: true,
    });

    const thingResource = things.addResource('{partitionKey}');
    thingResource.addMethod('GET', new LambdaIntegration(getItemsByPartitionFunction));

    // /things/{partitionKey}/{sortKey}
    const thingSortResource = thingResource.addResource('{sortKey}');
    // Secure PUT /things/{partitionKey}/{sortKey} with API Key (only one PUT method is defined)
    const putMethod = thingSortResource.addMethod('PUT', new LambdaIntegration(updateItemFunction), {
      apiKeyRequired: true,
    });

    // GET /things/{partitionKey}/{sortKey}/translation
    const translationResource = thingSortResource.addResource('translation');
    translationResource.addMethod('GET', new LambdaIntegration(translateItemFunction));

    // Create an API Key and Usage Plan
    const apiKey = new ApiKey(this, 'MyApiKey', {
      apiKeyName: 'MyApiKey',
      // You can optionally set a custom key value using 'value'
    });

    const usagePlan = new UsagePlan(this, 'MyUsagePlan', {
      name: 'MyUsagePlan',
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
      quota: {
        limit: 1000,
        period: Period.DAY,
      },
    });

    // Bind the API Key to the Usage Plan
    usagePlan.addApiKey(apiKey);

    // Bind protected POST and PUT methods to the Usage Plan with throttling configuration
    usagePlan.addApiStage({
      stage: api.deploymentStage,
      throttle: [
        {
          method: postMethod,
          throttle: { rateLimit: 5, burstLimit: 2 },
        },
        {
          method: putMethod,
          throttle: { rateLimit: 5, burstLimit: 2 },
        },
      ],
    });
  }
}
