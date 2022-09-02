import {CfnOutput, CfnParameter, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {IvsConstruct} from "./ivs-construct";
import {StorageConstruct} from "./storage-construct";
import {EventsConstruct} from "./events-construct";
import {StateMachineConstruct} from "./state-machine-construct";
import {LambdaConstruct} from "./lambda-construct";
import {CloudfrontConstruct} from "./cloudfront-construct";
import {SnsConstruct} from "./sns-contruct";

export class AmazonIvsDvrSubtitlesWebDemoStack extends Stack {
    private static MC_ID = "demo";
    private ivs: IvsConstruct;
    private storage: StorageConstruct;
    private eventBridge: EventsConstruct;
    private stateMachine: StateMachineConstruct;
    private lambdas: LambdaConstruct;
    private cloudfront: CloudfrontConstruct;
    private sns: SnsConstruct;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.sns = new SnsConstruct(this, 'Sns', {
            email: new CfnParameter(this, "email", {
                type: "String",
                description: "The email address used to subscribe to the SNS topic"
            }).valueAsString
        })
        this.storage = new StorageConstruct(this, 'Storage');
        this.cloudfront = new CloudfrontConstruct(this, 'Cloudfront', {
            bucket: this.storage.bucket
        })
        this.lambdas = new LambdaConstruct(this, 'Lambdas', {
            mediaConvertId: AmazonIvsDvrSubtitlesWebDemoStack.MC_ID,
            tableName: this.storage.tableName,
            cloudFrontDomainName: this.cloudfront.distributionDomainName
        });
        this.ivs = new IvsConstruct(this, 'Ivs', {
            bucketName: this.storage.bucketName
        })
        this.stateMachine = new StateMachineConstruct(this, 'StateMachine', {
            lambdaFunctions: this.lambdas.functions,
            topic: this.sns.topic
        })
        this.eventBridge = new EventsConstruct(this, 'Events', {
            ivsChannelArn: this.ivs.channelArn,
            lambdaFunctions: this.lambdas.functions,
            mediaConvertId: AmazonIvsDvrSubtitlesWebDemoStack.MC_ID,
            stateMachine: this.stateMachine.stateMachine
        });
        this.setIamPermissions();
        this.createCfnOutputs();

    }

    private setIamPermissions() {
        this.stateMachine.grantTaskResponse(this.lambdas.functions.eventWatcher)
        this.storage.grantReadToBucket(this.lambdas.functions.mediaConvert)
        this.storage.grantReadAndWriteToBucket(this.lambdas.functions.transcribe)
        this.storage.grantReadAndWriteToBucket(this.lambdas.roles.mediaConvert)
        this.storage.grantReadAndWriteToTable(this.lambdas.functions.mediaConvert)
        this.storage.grantReadAndWriteToTable(this.lambdas.functions.transcribe)
        this.storage.grantReadAndWriteToTable(this.lambdas.functions.eventWatcher)
    }

    private createCfnOutputs() {
        new CfnOutput(this, 'IvsChannelArn', {
            value: this.ivs.channelArn,
            description: 'IVS Channel ARN',
        });
        new CfnOutput(this, 'IvsIngestEndpoint', {
            value: this.ivs.ingestEndpoint,
            description: 'IVS Ingest Endpoint',
        });
        new CfnOutput(this, 'IvsStreamKey', {
            value: this.ivs.streamKeyValue,
            description: 'IVS Stream Key',
        });
        new CfnOutput(this, 'BucketName', {
            value: this.storage.bucketName,
            description: 'IVS Recording Bucket Name',
        });
        new CfnOutput(this, 'BucketArn', {
            value: this.storage.bucketArn,
            description: 'IVS Recording Bucket ARN',
        });
        new CfnOutput(this, 'TableName', {
            value: this.storage.tableName,
            description: 'DynamoDB Table Name',
        });
        new CfnOutput(this, 'CloudFrontDomainName', {
            value: this.cloudfront.distributionDomainName,
            description: 'CloudFront Domain Name',
        });
    }
}
