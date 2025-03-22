import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';

// API Gateway
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';

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

    //Use Nord to create Getalitensen
    const getAllItemsFunction = new NodejsFunction(this, 'GetAllItemsFunction', {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, '..', 'lambdas', 'getAllItems.ts'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadWriteData(getAllItemsFunction);

    //Use Nord to create a crititten finchton
    const createItemFunction = new NodejsFunction(this, 'CreateItemFunction', {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, '..', 'lambdas', 'createItem.ts'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadWriteData(createItemFunction);
//Use NodejsFunction to creat getItemsByPartitionFunction
    const getItemsByPartitionFunction = new NodejsFunction(this, 'GetItemsByPartitionFunction', {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, '..', 'lambdas', 'getItemsByPartition.ts'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadWriteData(getItemsByPartitionFunction);

    //Create and configure an API Gateway
    const api = new RestApi(this, 'AppApi', {
      restApiName: 'ThingsService',
    });

    const things = api.root.addResource('things');

    // GET /things
    things.addMethod('GET', new LambdaIntegration(getAllItemsFunction));
    // POST /things
    things.addMethod('POST', new LambdaIntegration(createItemFunction));
    const thingResource = things.addResource('{partitionKey}');
thingResource.addMethod('GET', new LambdaIntegration(getItemsByPartitionFunction));
  }
}
