import {Construct} from "constructs";
import {Bucket, IBucket} from "aws-cdk-lib/aws-s3";

export class S3RecordConstruct extends Construct {
    private bucket: IBucket;

    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.createBucket();
    }

    private createBucket() {
        this.bucket = new Bucket(this, 'IvsStorageBucket')
    }

    get bucketArn() {
        return this.bucket.bucketArn;
    }

    get bucketName() {
        return this.bucket.bucketName
    }


}
