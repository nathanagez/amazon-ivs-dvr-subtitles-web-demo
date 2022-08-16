import {Construct} from "constructs";
import {aws_ivs as ivs} from 'aws-cdk-lib';

export class IvsConstruct extends Construct {
    private channel: ivs.CfnChannel;
    private streamKey: ivs.CfnStreamKey;
    private recordingConfig: ivs.CfnRecordingConfiguration;

    constructor(scope: Construct, id: string) {
        super(scope, id);
    }

    createChannel(name: string, id: string = "Channel") {
        const props = {
            authorized: false,
            latencyMode: 'LOW',
            name,
            type: 'STANDARD',
            recordingConfigurationArn: this.recordingConfig.attrArn || ""
        }
        this.channel = new ivs.CfnChannel(this, id, props);
    }

    addStreamKey(id: string = "StreamKey") {
        if (!this.channel)
            throw new Error("You should create a channel first")
        this.streamKey = new ivs.CfnStreamKey(this, id, {
            channelArn: this.channelArn,
        });
    }

    createRecordingConfig(bucketName: string, id: string = "RecordingConfiguration") {
        this.recordingConfig = new ivs.CfnRecordingConfiguration(this, id, {
            destinationConfiguration: {
                s3: {
                    bucketName
                },
            }
        });
    }

    get channelArn() {
        return this.channel.attrArn;
    }
}
