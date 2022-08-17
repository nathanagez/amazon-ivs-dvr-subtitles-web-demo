interface Detail {
    "timestamp": number;
    "accountId": string;
    "queue": string;
    "jobId": string;
    "status": "COMPLETE" | "ERROR";
    "userMetadata": {
        "id": string;
    };
    "outputGroupDetails": Array<{
        "outputDetails": Array<{
            "outputFilePaths": string[];
            "durationInMs": number;
        }>;
        "type": string;
    }>;
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
