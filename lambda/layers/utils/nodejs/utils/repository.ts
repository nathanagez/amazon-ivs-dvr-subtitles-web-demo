/*
* Be careful with reserved words for DynamoDB
* https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ReservedWords.html
* */

import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocument,
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
} from '@aws-sdk/lib-dynamodb';
import {NativeAttributeValue} from '@aws-sdk/util-dynamodb';

interface Key {
    [key: string]: NativeAttributeValue
}

/**
 * This is an abstract class with generic functions to interact with the database
 */
export class BaseRepository {

    private readonly client: DynamoDBClient;

    private readonly documentClient: DynamoDBDocumentClient;

    private readonly tableName: string;

    constructor(client: DynamoDBClient, tableName: string) {
        this.client = client;
        this.documentClient = DynamoDBDocument.from(this.client, {
            marshallOptions: {
                removeUndefinedValues: true,
            },
        });
        this.tableName = tableName;
    }

    async getItem(key: Key) {
        try {
            const command = new GetCommand({
                TableName: this.tableName,
                Key: key,
            });
            return await this.documentClient.send(command);
        } catch (err) {
            throw new Error(err);
        }
    }

    async putItem(item: Key) {
        try {
            const command = new PutCommand({
                TableName: this.tableName,
                Item: item,
            });
            return await this.documentClient.send(command);
        } catch (err) {
            throw new Error(err);
        }
    }
}
