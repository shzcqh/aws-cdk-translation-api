import { DynamoDB } from "aws-sdk";

/**
 * Lambda handler to update an item in the DynamoDB table.
 * Expects path parameters: partitionKey, sortKey
 * Expects JSON body with fields to update (e.g. description).
 */
export const handler = async (event: any) => {
  const db = new DynamoDB.DocumentClient();
  const tableName = process.env.TABLE_NAME;

  try {
    // Get the PK and SK from the path parameters
    const partitionKey = event.pathParameters?.partitionKey;
    const sortKey = event.pathParameters?.sortKey;
    if (!partitionKey || !sortKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "partitionKey and sortKey are required" }),
      };
    }

    //Get the fields you want to update from the request body
    const body = JSON.parse(event.body || "{}");
    const newDescription = body.description;
    if (!newDescription) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "description field is required in the body" }),
      };
    }

    // Construct an UpdateExpression
    // Update Deskription
    const params: DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: tableName!,
      Key: {
        pk: partitionKey,
        sk: sortKey,
      },
      UpdateExpression: "SET #desc = :newDesc",
      ExpressionAttributeNames: {
        "#desc": "description",
      },
      ExpressionAttributeValues: {
        ":newDesc": newDescription,
      },
      ReturnValues: "ALL_NEW",
    };

    //update()
    const result = await db.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Item updated successfully",
        updatedItem: result.Attributes,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};