import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

interface LambdaStackProps extends StackProps {
  table: Table;
}

export class LambdaStack extends Stack {
  public readonly getAllItemsFunction: NodejsFunction;
  public readonly createItemFunction: NodejsFunction;
  public readonly getItemsByPartitionFunction: NodejsFunction;
  public readonly updateItemFunction: NodejsFunction;
  public readonly translateItemFunction: NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // Create Lambda function for GET /things
    this.getAllItemsFunction = new NodejsFunction(this, 'GetAllItemsFunction', {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, '..', 'lambdas', 'getAllItems.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
    });
    props.table.grantReadWriteData(this.getAllItemsFunction);

    // Create Lambda function for POST /things
    this.createItemFunction = new NodejsFunction(this, 'CreateItemFunction', {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, '..', 'lambdas', 'createItem.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
    });
    props.table.grantReadWriteData(this.createItemFunction);

    // Create Lambda function for GET /things/{partitionKey}
    this.getItemsByPartitionFunction = new NodejsFunction(this, 'GetItemsByPartitionFunction', {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, '..', 'lambdas', 'getItemsByPartition.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
    });
    props.table.grantReadWriteData(this.getItemsByPartitionFunction);

    // Create Lambda function for PUT /things/{partitionKey}/{sortKey}
    this.updateItemFunction = new NodejsFunction(this, 'UpdateItemFunction', {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, '..', 'lambdas', 'updateItem.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
    });
    props.table.grantReadWriteData(this.updateItemFunction);

    // Create Lambda function for GET /things/{partitionKey}/{sortKey}/translation
    this.translateItemFunction = new NodejsFunction(this, 'TranslateItemFunction', {
      runtime: Runtime.NODEJS_18_X,
      entry: join(__dirname, '..', 'lambdas', 'translateItem.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
    });
    // Grant read and write permissions to the translation function
    props.table.grantReadWriteData(this.translateItemFunction);
    // Grant permission to call AWS Translate and Comprehend
    this.translateItemFunction.addToRolePolicy(
      new PolicyStatement({
        actions: ['translate:*', 'comprehend:DetectDominantLanguage'],
        resources: ['*'],
      })
    );
  }
}
