import {Event} from "./interfaces";
import {MediaConvertClient, CreateJobCommand} from "@aws-sdk/client-mediaconvert";

const REQUIRED_ENVS = [
    "STATE_MACHINE_ARN",
    "REGION"
]

const params = {
    "Queue": "arn:aws:mediaconvert:REGION:ACCOUNT_ID:queues/Default", // TODO: replace
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
                        "Destination": "s3://bucketName/prefix/" // TODO: replace by destination
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
                "FileInput": "s3://bucketName/ivs/v1/ACCOUNT_ID/CHANNEL_ID/2022/8/14/22/3/uuid/media/hls/master.m3u8" // TODO: Replace by m3u8 location extracted from metadata
            }
        ]
    },
    "AccelerationSettings": {
        "Mode": "DISABLED"
    },
    "StatusUpdateInterval": "SECONDS_60",
    "Priority": 0
}


const createMediaConvertJob = async () => {
    const client = new MediaConvertClient({region: process.env.REGION});
    const command = new CreateJobCommand(params);
    return await client.send(command);
}

export const handler = async (event: Event) => {
    console.log('event', JSON.stringify(event, null, 2))
    const missing_env = REQUIRED_ENVS.filter((name) => !process.env[name])
    if (missing_env.length)
        throw new Error(`Missing the following env variables: ${missing_env.join(', ')}`)


    try {
        // TODO: Before creating MediaConvert job, look for events/recording-ended.json file
        await createMediaConvertJob()
    } catch (e) {
        console.error(e)
        throw new Error(e)
    }
}
