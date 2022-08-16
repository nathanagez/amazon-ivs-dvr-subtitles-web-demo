import {BuildMediaConvertJobTemplateProps, Context, Event, IvsMetadata} from "./interfaces";
import {
    MediaConvertClient,
    CreateJobCommand,
    CreateJobCommandInput,
    DescribeEndpointsCommand
} from "@aws-sdk/client-mediaconvert";
import {GetObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {streamToString} from '/opt/nodejs/utils/stream';
import {BaseRepository} from '/opt/nodejs/utils/repository';
import {Readable} from "stream";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";

const REQUIRED_ENVS: string[] = [
    "MC_ROLE",
    "MC_ID",
    "SERVICE_TOKENS_TABLE"
]

const paramsTemplate = {
    "Queue": "arn:aws:mediaconvert:REGION:ACCOUNT_MC_ID:queues/Default", // TODO: replace
    "UserMetadata": {},
    "Role": "arn:aws:iam::ACCOUNT_ID:role/service-role/MediaConvert_Default_Role", // TODO: replace
    "Settings": {
        "TimecodeConfig": {
            "Source": "ZEROBASED"
        },
        "OutputGroups": [
            {
                "Name": "File Group",
                "Outputs": [
                    {
                        "ContainerSettings": {
                            "Container": "RAW"
                        },
                        "AudioDescriptions": [
                            {
                                "AudioSourceName": "Audio Selector 1",
                                "CodecSettings": {
                                    "Codec": "MP3",
                                    "Mp3Settings": {
                                        "Channels": 1,
                                        "RateControlMode": "VBR",
                                        "SampleRate": 44100,
                                        "VbrQuality": 0
                                    }
                                }
                            }
                        ]
                    }
                ],
                "OutputGroupSettings": {
                    "Type": "FILE_GROUP_SETTINGS",
                    "FileGroupSettings": {
                        "Destination": "" // TODO: replace by destination
                    }
                }
            }
        ],
        "Inputs": [
            {
                "AudioSelectors": {
                    "Audio Selector 1": {
                        "DefaultSelection": "DEFAULT"
                    }
                },
                "TimecodeSource": "ZEROBASED",
                "FileInput": "" // TODO: Replace by m3u8 location extracted from metadata
            }
        ]
    },
    "AccelerationSettings": {
        "Mode": "DISABLED"
    },
    "StatusUpdateInterval": "SECONDS_60",
    "Priority": 0
}


const getMediaConvertEndpoint = async (region: string) => {
    const client = new MediaConvertClient({region});
    const command = new DescribeEndpointsCommand({});
    return await client.send(command);
}

const createMediaConvertJob = async (params: CreateJobCommandInput, region: string, endpoint: string) => {
    const client = new MediaConvertClient({region, endpoint});
    const command = new CreateJobCommand(params);
    return await client.send(command);
}

const getObjectFromS3 = async (bucket: string, key: string, region: string) => {
    const client = new S3Client({region})
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
    });
    return await client.send(command);
}

const buildMediaConvertJobTemplate = ({params, metadata, keyPrefix}: BuildMediaConvertJobTemplateProps<typeof paramsTemplate>) => {
    const masterPlaylistFileName = metadata.media.hls.playlist;
    const path = metadata.media.hls.path;
    params.Queue = `arn:aws:mediaconvert:${metadata.region}:${metadata.accountId}:queues/Default`;
    params.Role = process.env.MC_ROLE!;
    params.Settings.Inputs[0].FileInput = `s3://${keyPrefix}/${path}/${masterPlaylistFileName}`;
    params.Settings.OutputGroups[0].OutputGroupSettings.FileGroupSettings.Destination = `s3://${keyPrefix}/mediaconvert/audio`;
    params.UserMetadata = {id: process.env.MC_ID}
    return {...params}
}

export const handler = async (event: Event, context: Context) => {
    console.log('event', JSON.stringify(event, null, 2))
    const missingEnv = REQUIRED_ENVS.filter((name) => !process.env[name])
    if (missingEnv.length)
        throw new Error(`Missing the following env variables: ${missingEnv.join(', ')}`)

    try {
        const [, , , region, accountId] = context.invokedFunctionArn.split(':')
        const {input, taskToken} = event;
        const bucket = input.detail.recording_s3_bucket_name;
        const key = `${input.detail.recording_s3_key_prefix}/events/recording-ended.json`
        const {Body} = await getObjectFromS3(bucket, key, region);
        const metadata: IvsMetadata = JSON.parse(await streamToString(Body as Readable))
        const mediaConvertParams = buildMediaConvertJobTemplate({
            params: paramsTemplate,
            metadata: {...metadata, region, accountId},
            keyPrefix: `${input.detail.recording_s3_bucket_name}/${input.detail.recording_s3_key_prefix}`
        })
        const {Endpoints: [{Url: endpoint}] = []} = await getMediaConvertEndpoint(region);
        const db = new BaseRepository(new DynamoDBClient({}), process.env.SERVICE_TOKENS_TABLE!);
        const result = await createMediaConvertJob(mediaConvertParams, region, endpoint!)
        return db.putItem({
            Id: result.Job?.Id,
            TaskToken: taskToken
        });
    } catch (e) {
        console.error(e)
        return e;
    }
}
