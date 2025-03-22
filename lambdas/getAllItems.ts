import { DynamoDB } from "aws-sdk";

/**
 * Lambda handler to retrieve all items from the DynamoDB table.
 * For now, it uses a simple 'scan' to return everything.
 */
export const handler = async (event: any) => {
  const db = new DynamoDB.DocumentClient();
  const tableName = process.env.TABLE_NAME;

  try {
    
    const data = await db.scan({ TableName: tableName! }).promise();
    
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