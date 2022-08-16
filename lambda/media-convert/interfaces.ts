interface Detail {
    recording_status: string;
    recording_status_reason: string;
    recording_s3_bucket_name: string;
    recording_s3_key_prefix: string;
    recording_duration_ms: number;
    channel_name: string;
    stream_id: string;
}

export interface Event {
    input: {
        version: string;
        id: string;
        'detail-type': string;
        source: string;
        account: string;
        time: string;
        region: string;
        resources: string[],
        detail: Detail
    },
    taskToken: string;
}

export interface Context {
    functionName: string;
    functionVersion: string;
    invokedFunctionArn: string;
    memoryLimitInMb: string;
    awsRequestId: string;
    logGroupName: string;
    logStreamName: string;
}

interface AWS extends IvsMetadata {
    region: string,
    accountId: string
}

export interface BuildMediaConvertJobTemplateProps<T> {
    params: T;
    metadata: AWS;
    keyPrefix: string;
}

export interface IvsMetadata {
    "version": string;
    "channel_arn": string;
    "recording_ended_at": string;
    "recording_started_at": string;
    "recording_status": string;
    "media": {
        "hls": {
            "duration_ms": number;
            "path": string;
            "playlist": string;
            "renditions": Array<{
                "path": string;
                "playlist": string;
                "resolution_height": number;
                "resolution_width": number;
            }>
        },
        "thumbnails": {
            "path": string;
        }
    }
}
