import { DynamoDB, Translate } from "aws-sdk";

/**
 * Lambda handler to retrieve an item by pk/sk,
 * then translate its 'description' field to a specified language.
 * Expects path parameters: partitionKey, sortKey
 * Query param: language (e.g. ?language=fr)
 */
export const handler = async (event: any) => {
  const db = new DynamoDB.DocumentClient();
  const translator = new Translate();
  const tableName = process.env.TABLE_NAME;

  try {
    //Get pk, sk
    const partitionKey = event.pathParameters?.partitionKey;
    const sortKey = event.pathParameters?.sortKey;
    if (!partitionKey || !sortKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "partitionKey and sortKey are required" }),
      };
    }

    // Get the target language
    const targetLanguage = event.queryStringParameters?.language || "en";

    // Query DynamoDB to get the record
    const getResult = await db
      .get({
        TableName: tableName!,
        Key: { pk: partitionKey, sk: sortKey },
      })
      .promise();

    const item = getResult.Item;
    if (!item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Item not found" }),
      };
    }

    //Invoke the AWS Translate service
    const textToTranslate = item.description || "";
    if (!textToTranslate) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          original: "",
          translated: "",
          message: "description is empty, nothing to translate",
        }),
      };
    }
//Gets or initializes the translations field
const cachedTranslations = item.translations || {};
//If the target language already has a cache, it will be returned directly
if (cachedTranslations[targetLanguage]) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      original: textToTranslate,
      translated: cachedTranslations[targetLanguage],
      sourceLanguage: "cached",
      targetLanguage,
    }),
  };
}

    const translateResult = await translator
      .translateText({
        SourceLanguageCode: "auto", 
        TargetLanguageCode: targetLanguage,
        Text: textToTranslate,
      })
      .promise();
      const translatedText = translateResult.TranslatedText;
      //Writeback is cached to DynamoDB
      const updatedTranslations = {
        ...cachedTranslations,
        [targetLanguage]: translatedText,
      };
  
      await db
        .update({
          TableName: tableName!,
          Key: { pk: partitionKey, sk: sortKey },
          UpdateExpression: "SET translations = :t",
          ExpressionAttributeValues: {
            ":t": updatedTranslations,
          },
        })
        .promise();
  
    //Returns the translation result
    return {
      statusCode: 200,
      body: JSON.stringify({
        original: textToTranslate,
        translated: translateResult.TranslatedText,
        targetLanguage: targetLanguage,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};
