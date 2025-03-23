## Serverless REST Assignment - Distributed Systems.

__Name:__ Huaze Shao

__Demo:__ https://youtu.be/nD4gVHs4v6w

### Context.

**Context:** User Comments Translation API

This web API is designed to translate user-generated comments into multiple languages. The DynamoDB table stores each comment along with its translated versions, enabling efficient multi-language support without repeated translation calls.

**Table item attributes:**
+ **commentId** - string (Partition key, corresponds to `pk`)
+ **userId** - string (Sort key, corresponds to `sk`)
+ **description** - string (The original comment text to be translated)
+ **translations** - Map<string, string> (Stores cached translations; e.g., "fr": "Bonjour le monde", "zh": "你好，世界")

### App API endpoints.

- **POST /things**  
  Add a new comment. The request body includes `pk` (commentId), `sk` (userId), and `description`.

- **GET /things**  
  Retrieve all comments.

- **GET /things/{partitionKey}**  
  Retrieve all comments with a specified partition key (commentId).

- **GET /things/{partitionKey}?filter=xxx**  
  Retrieve comments with a specified partition key, filtering those whose description contains a given keyword.

- **PUT /things/{partitionKey}/{sortKey}**  
  Update an existing comment's description.

- **GET /things/{partitionKey}/{sortKey}/translation?language=fr**  
  Translate a comment's description to the specified language (e.g., French). The translation is cached in the `translations` field to avoid repeated calls to AWS Translate.

### Features.

#### Translation persistence 

To reduce repeated translation costs, the API caches translation results in DynamoDB. When a translation request is received, the Lambda function first checks if a translation for the specified language already exists in the `translations` attribute of the comment item. If found, it returns the cached result (indicated by `"sourceLanguage": "cached"`); otherwise, it calls AWS Translate, saves the result to the item, and returns the translation.

Example item structure with translations:
+ **commentId** - string  (Partition key)
+ **userId** - string  (Sort key)
+ **description** - string
+ **translations** - Map<string, string> (e.g., `"fr": "Bonjour le monde"`)

#### Custom L2 Construct 

*(Not implemented in this project.)*

#### Multi-Stack app 

The project is structured into multiple CDK stacks:
+ **DynamoStack**: Provisions the DynamoDB table.
+ **LambdaStack**: Deploys all Lambda functions and grants them permissions to access the table.
+ **ApiStack**: Configures the API Gateway, binds the Lambda functions to endpoints, and sets up API Key protection along with a Usage Plan.

#### Lambda Layers 

*(Not implemented in this project.)*

#### API Keys. 
API Key authentication is implemented to protect the POST and PUT endpoints. For these endpoints, the API Gateway requires a valid `x-api-key` header to allow access. Below is an excerpt from the CDK code:

~~~ts
// Secure POST /things with API Key
const postMethod = things.addMethod('POST', new LambdaIntegration(createItemFunction), {
  apiKeyRequired: true,
});

// Secure PUT /things/{partitionKey}/{sortKey} with API Key
const putMethod = thingSortResource.addMethod('PUT', new LambdaIntegration(updateItemFunction), {
  apiKeyRequired: true,
});
~~~

A Usage Plan is also configured to bind the API Key with throttling settings.

### Extra (If relevant).

No additional CDK/serverless features have been implemented beyond the requirements. However, the multi-stack architecture significantly improves the organization and maintainability of the solution.

