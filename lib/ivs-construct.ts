import {Construct} from "constructs";
import {aws_ivs as ivs} from 'aws-cdk-lib';

interface Props {
    bucketName: string;
}

export class IvsConstruct extends Construct {
    private channel: ivs.CfnChannel;
    private streamKey: ivs.CfnStreamKey;
    private recordingConfig: ivs.CfnRecordingConfiguration;

    constructor(scope: Construct, id: string, props: Props) {
        super(scope, id);
        this.recordingConfig = this.createRecordingConfig(props.bucketName, 'RecordingConfiguration')
        this.channel = this.createChannel('ivs-subtitles-demo', 'Channel')
        this.streamKey = this.addStreamKey('StreamKey', this.channelArn);
    }

    createChannel(name: string, id: string) {
        const props = {
            authorized: false,
            latencyMode: 'LOW',
            name,
            type: 'STANDARD',
            recordingConfigurationArn: this.recordingConfig.attrArn || ""
        }
        return new ivs.CfnChannel(this, id, props);
    }

    addStreamKey(id: string, channelArn: string) {
        return new ivs.CfnStreamKey(this, id, {
            channelArn: channelArn,
        });
    }

    createRecordingConfig(bucketName: string, id: string) {
        return new ivs.CfnRecordingConfiguration(this, id, {
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

    get ingestEndpoint() {
        return `rtmps://${this.channel.attrIngestEndpoint}:443/app`;
    }

    get streamKeyValue() {
        return this.streamKey.attrValue;
    }
}
