import {BaseRepository} from '/opt/nodejs/utils/repository';
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {Event} from "./interfaces"
import * as path from "path";
import * as crypto from "crypto"
import {Media, StartTranscriptionJobCommand, SubtitleFormat, TranscribeClient} from "@aws-sdk/client-transcribe";

const REQUIRED_ENVS = [
    "SERVICE_TOKENS_TABLE"
]

const startTranscribeJob = async (mediaLocation: string, jobName: string) => {
    const client = new TranscribeClient({});
    const [, , bucketName] = path.parse(mediaLocation as string).dir.split("/")
    const key = path.parse(mediaLocation).dir.split("/").slice(3).join("/")
    const params = {
        IdentifyLanguage: true,
        Media: {
            MediaFileUri: mediaLocation
        },
        TranscriptionJobName: jobName,
        Subtitles: {
            Formats: [SubtitleFormat.VTT, SubtitleFormat.SRT]
        },
        OutputBucketName: bucketName,
        OutputKey: `${key}/`
    }
    const command = new StartTranscriptionJobCommand(params);
    return await client.send(command);
}

const extractOutputFilePaths = (event: Event) => {
    const {input: {detail: {outputGroupDetails: [{outputDetails: [{outputFilePaths}]}]}}} = event;
    return outputFilePaths;
}

export const handler = async (event: Event) => {
    console.log('event', JSON.stringify(event, null, 2))
    const missingEnv = REQUIRED_ENVS.filter((name) => !process.env[name])
    if (missingEnv.length)
        throw new Error(`Missing the following env variables: ${missingEnv.join(', ')}`)
    try {
        const db = new BaseRepository(new DynamoDBClient({}), process.env.SERVICE_TOKENS_TABLE!);
        const [mediaLocation] = extractOutputFilePaths(event);
        const uuid = crypto.randomBytes(8).toString('hex');
        const result = await startTranscribeJob(mediaLocation, uuid);
        await db.putItem({
            Id: result.TranscriptionJob?.TranscriptionJobName || uuid,
            TaskToken: event.taskToken,
            TaskOutput: JSON.stringify(event.input)
        });
    } catch (e) {
        console.error(e);
        return e;
    }
}
