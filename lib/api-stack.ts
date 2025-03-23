import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RestApi, LambdaIntegration, ApiKey, UsagePlan, Period } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface ApiStackProps extends StackProps {
  getAllItemsFunction: NodejsFunction;
  createItemFunction: NodejsFunction;
  getItemsByPartitionFunction: NodejsFunction;
  updateItemFunction: NodejsFunction;
  translateItemFunction: NodejsFunction;
}

export class ApiStack extends Stack {
  public readonly api: RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create API Gateway
    this.api = new RestApi(this, 'AppApi', {
      restApiName: 'ThingsService',
    });

    const things = this.api.root.addResource('things');

    // GET /things
    things.addMethod('GET', new LambdaIntegration(props.getAllItemsFunction));

    // Secure POST /things with API Key
    const postMethod = things.addMethod('POST', new LambdaIntegration(props.createItemFunction), {
      apiKeyRequired: true,
    });

    const thingResource = things.addResource('{partitionKey}');
    thingResource.addMethod('GET', new LambdaIntegration(props.getItemsByPartitionFunction));

    // /things/{partitionKey}/{sortKey}
    const thingSortResource = thingResource.addResource('{sortKey}');
    // Secure PUT /things/{partitionKey}/{sortKey} with API Key
    const putMethod = thingSortResource.addMethod('PUT', new LambdaIntegration(props.updateItemFunction), {
      apiKeyRequired: true,
    });

    // GET /things/{partitionKey}/{sortKey}/translation
    const translationResource = thingSortResource.addResource('translation');
    translationResource.addMethod('GET', new LambdaIntegration(props.translateItemFunction));

    // Create an API Key and Usage Plan for protecting POST and PUT endpoints
    const apiKey = new ApiKey(this, 'MyApiKey', {
      apiKeyName: 'MyApiKey',
      // Optionally, set a custom key value using 'value'
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
      stage: this.api.deploymentStage,
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
