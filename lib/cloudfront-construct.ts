import {Construct} from "constructs";
import {Distribution} from "aws-cdk-lib/aws-cloudfront";
import {S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import {IBucket} from "aws-cdk-lib/aws-s3";

interface Props {
    bucket: IBucket
}

export class CloudfrontConstruct extends Construct {
    private distribution: Distribution;
    constructor(scope: Construct, id: string, props: Props) {
        super(scope, id);

        this.distribution = this.createDistribution(props.bucket, 'VodDistribution')

    }

    private createDistribution(bucket: IBucket, id: string) {
        return new Distribution(this, id, {
            defaultBehavior: { origin: new S3Origin(bucket) },
            comment: "Distribution for VOD - IVS subtitles demo"
        });
    }

    get distributionDomainName() {
        return this.distribution.distributionDomainName;
    }
}
