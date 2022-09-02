import {Construct} from "constructs";
import {Bucket, IBucket} from "aws-cdk-lib/aws-s3";
import {AttributeType, Table} from "aws-cdk-lib/aws-dynamodb";
import {IGrantable} from "aws-cdk-lib/aws-iam";
import {RemovalPolicy} from "aws-cdk-lib";

export class StorageConstruct extends Construct {
    public readonly bucket: IBucket;
    private table: Table;

    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.bucket = this.createBucket('IvsRecords');
        this.table = this.createDynamoTable('ServiceTokens')
    }

    private createDynamoTable(id: string) {
        return new Table(this, id, {
            partitionKey: {
                name: 'Id',
                type: AttributeType.STRING
            }
        });
    }

    private createBucket(id: string) {
        return new Bucket(this, id, {
            removalPolicy: RemovalPolicy.DESTROY
        })
    }

    get tableName() {
        return this.table.tableName
    }

    get tableArn() {
        return this.table.tableArn
    }

    grantReadAndWriteToTable(identity: IGrantable) {
        this.table.grantReadWriteData(identity)
    }

    get bucketArn() {
        return this.bucket.bucketArn;
    }

    get bucketName() {
        return this.bucket.bucketName
    }

    grantReadToBucket(identity: IGrantable) {
        this.bucket.grantRead(identity)
    }

    grantReadAndWriteToBucket(identity: IGrantable) {
        this.bucket.grantReadWrite(identity)
    }
}
