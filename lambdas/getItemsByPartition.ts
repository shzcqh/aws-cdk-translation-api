import { DynamoDB } from "aws-sdk";

/**
 * Lambda handler to retrieve items by partitionKey,
 * optionally filtered by a query string parameter `filter`.
 */
export const handler = async (event: any) => {
  const db = new DynamoDB.DocumentClient();
  const tableName = process.env.TABLE_NAME;

  try {
    // Get the partitionKey from the path parameter
    const partitionKey = event.pathParameters?.partitionKey;
    if (!partitionKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "partitionKey is required" }),
      };
    }

    // Get the filter from the query parameters
    const filterValue = event.queryStringParameters?.filter;

    // Construct the Query parameter
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: tableName!,
      KeyConditionExpression: "pk = :pkVal",
      ExpressionAttributeValues: {
        ":pkVal": partitionKey,
      },
    };

    if (filterValue) {
      params.FilterExpression = "contains(#desc, :filterVal)";
      //  need to map the description property with ExpressionAttributeNames
      params.ExpressionAttributeNames = {
        "#desc": "description",
      };
      params.ExpressionAttributeValues![":filterVal"] = filterValue;
    }

    // Execute the query
    const data = await db.query(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};
