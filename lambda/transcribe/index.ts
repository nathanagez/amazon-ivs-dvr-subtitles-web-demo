import {BaseRepository} from '/opt/nodejs/utils/repository';
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {Event} from "./interfaces"
import * as path from "path";
import {Media, StartTranscriptionJobCommand, SubtitleFormat, TranscribeClient} from "@aws-sdk/client-transcribe";

const startTranscribeJob = async (mediaLocation: Media, jobName: string) => {
    const client = new TranscribeClient({});
    const [, , bucketName] = path.parse(mediaLocation as string).dir.split("/")
    const key = path.parse(mediaLocation as string).dir.split("/").slice(3).join("/")
    const command = new StartTranscriptionJobCommand({
        IdentifyLanguage: true,
        Media: mediaLocation,
        TranscriptionJobName: jobName,
        Subtitles: {
            Formats: [SubtitleFormat.VTT, SubtitleFormat.SRT]
        },
        OutputBucketName: bucketName,
        OutputKey: `${key}/`
    });
    return await client.send(command);
}

const extractOutputFilePaths = (event: Event) => {
    const {input: {detail: {outputGroupDetails: [{outputDetails: [{outputFilePaths}]}]}}} = event;
    return outputFilePaths;
}

export const handler = async (event: Event) => {
    console.log('event', JSON.stringify(event, null, 2))
    try {
        const db = new BaseRepository(new DynamoDBClient({}), process.env.SERVICE_TOKENS_TABLE!);
        const [mediaLocation] = extractOutputFilePaths(event);
        const result = await startTranscribeJob(mediaLocation as Media, 'test-nathan');
        console.log('result', JSON.stringify(result, null, 2));
        // await db.putItem({
        //     Id: result.Job?.Id,
        //     TaskToken: taskToken
        // });
    } catch (e) {
        console.error(e);
        return e;
    }
}
