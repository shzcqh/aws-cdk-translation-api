# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
# AWS CDK Translation API

## Project Overview

This project demonstrates how to use **AWS CDK** to build a serverless REST API that provides CRUD operations on a **DynamoDB** table and includes a text translation feature. The translation feature leverages **AWS Translate** to translate the `description` field of an item into a specified language, with caching to avoid repeated translation calls. Additionally, **API Key** authorization is applied to protect the POST and PUT endpoints.

## Architecture

- **DynamoDB Table**  
  Uses a composite primary key (`pk` and `sk`), and stores a `translations` map to cache translated text for different languages.

- **Lambda Functions**  
  - **GetAllItemsFunction**: Retrieves all items (`GET /things`)  
  - **CreateItemFunction**: Inserts a new item (`POST /things`)  
  - **GetItemsByPartitionFunction**: Retrieves items by partition key (`GET /things/{partitionKey}`)  
  - **UpdateItemFunction**: Updates an existing item (`PUT /things/{partitionKey}/{sortKey}`)  
  - **TranslateItemFunction**: Calls AWS Translate to translate `description` and caches the result in DynamoDB (`GET /things/{pk}/{sk}/translation?language=xx`)

- **API Gateway**  
  - Provides REST endpoints for the Lambda functions  
  - Uses an **API Key** and **Usage Plan** to protect POST/PUT endpoints  
  - Other GET endpoints are publicly accessible

- **Translation Caching**  
  If `TranslateItemFunction` detects an existing translation in `translations[language]`, it returns the cached result immediately; otherwise, it calls AWS Translate and writes the result back to the cache.

- **Multi-Stack Architecture** (optional advanced design):
  - **DynamoStack**: Creates and exposes the DynamoDB table  
  - **LambdaStack**: Creates all Lambda functions, granting them permissions to read/write the table  
  - **ApiStack**: Creates the API Gateway, binds Lambda functions to specific paths/methods, and configures API Key and Usage Plan