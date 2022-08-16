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
    version: string;
    id: string;
    'detail-type': string;
    source: string;
    account: string;
    time: string;
    region: string;
    resources: string[],
    detail: Detail
}
