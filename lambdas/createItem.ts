import { DynamoDB } from "aws-sdk";
import { v4 as uuid } from "uuid";

/**
 * Lambda handler to create a new item in the DynamoDB table.
 * Expects a JSON body with optional pk, sk, and description fields.
 */
export const handler = async (event: any) => {
  const db = new DynamoDB.DocumentClient();
  const tableName = process.env.TABLE_NAME;
  
  try {
    
    const body = JSON.parse(event.body || "{}");

   
    const pkValue = body.pk || uuid();
    const skValue = body.sk || "defaultSK";
    
    const item = {
      pk: pkValue,
      sk: skValue,
      description: body.description || "No description",
      
    };

    const params = {
      TableName: tableName!,
      Item: item,
    };

    await db.put(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(item),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};