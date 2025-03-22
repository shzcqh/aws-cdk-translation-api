import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib'; 
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
// Lambda
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
// API Gateway
import { RestApi, LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
export class AwsCdkTranslationApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    
    const table = new Table(this, 'MyApiTable', {
      tableName: 'MyApiTable',
      partitionKey: {
        name: 'pk',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    
    new CfnOutput(this, 'TableNameOutput', {
      value: table.tableName
    });
  }
}