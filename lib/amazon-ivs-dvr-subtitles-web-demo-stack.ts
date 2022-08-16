import {CfnOutput, CfnParameter, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {IvsConstruct} from "./ivs-construct";
import {S3RecordConstruct} from "./s3-record-construct";
import {EventBridgeRules} from "./eventbridge-rules-construct";
import {StateMachineConstruct} from "./state-machine-construct";

export class AmazonIvsDvrSubtitlesWebDemoStack extends Stack {
    private ivs: IvsConstruct;
    private s3: S3RecordConstruct;
    private eventBridgeRules: EventBridgeRules;
    private stateMachine: StateMachineConstruct;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.s3 = new S3RecordConstruct(this, 'RecordLocation');
        this.ivs = new IvsConstruct(this, 'IVS')
        this.eventBridgeRules = new EventBridgeRules(this, 'EventBridgeRules');
        this.stateMachine = new StateMachineConstruct(this, 'StateMachine')
        this.setupIvs();
        this.setupEventBridgeRules();
        this.createCfnOutputs();
    }

    private setupIvs() {
        this.ivs.createRecordingConfig(this.s3.bucketName)
        this.ivs.createChannel('my-demo-channel');
        this.ivs.addStreamKey();
    }

    private setupEventBridgeRules() {
        this.eventBridgeRules.createRule({
            eventPattern: {
                source: ["aws.ivs"],
                detailType: ["IVS Recording State Change"],
                resources: [this.ivs.channelArn],
                detail: {
                    "recording_status": ["Recording End"]
                }
            },
        })
        this.eventBridgeRules.addFnTarget(this.eventBridgeRules.createFnTarget())
    }

    private createCfnOutputs() {
        new CfnOutput(this, 'IvsChannelArn', {
            value: this.ivs.channelArn,
            description: 'IVS Channel ARN',
        });
        new CfnOutput(this, 'BucketName', {
            value: this.s3.bucketName,
            description: 'IVS Recording Bucket Name',
        });
        new CfnOutput(this, 'BucketArn', {
            value: this.s3.bucketArn,
            description: 'IVS Recording Bucket ARN',
        });
    }
}
