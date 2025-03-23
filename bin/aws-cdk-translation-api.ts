#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DynamoStack } from '../lib/dynamo-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

// Instantiate the DynamoDB stack
const dynamoStack = new DynamoStack(app, 'DynamoStack');

// Instantiate the Lambda stack, passing the DynamoDB table from DynamoStack
const lambdaStack = new LambdaStack(app, 'LambdaStack', {
  table: dynamoStack.table,
});

// Instantiate the API stack, passing the Lambda functions from LambdaStack
const apiStack = new ApiStack(app, 'ApiStack', {
  getAllItemsFunction: lambdaStack.getAllItemsFunction,
  createItemFunction: lambdaStack.createItemFunction,
  getItemsByPartitionFunction: lambdaStack.getItemsByPartitionFunction,
  updateItemFunction: lambdaStack.updateItemFunction,
  translateItemFunction: lambdaStack.translateItemFunction,
});
