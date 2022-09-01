import {Event} from './interfaces'
import {SendTaskFailureCommand, SendTaskSuccessCommand, SFNClient} from '@aws-sdk/client-sfn';
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {BaseRepository} from "/opt/nodejs/utils/repository";
import * as PATH from "path";

const REQUIRED_ENVS = [
    "SERVICE_TOKENS_TABLE",
    "CLOUDFRONT_DOMAIN_NAME"
]

const sfn = new SFNClient({});
const db = new BaseRepository(new DynamoDBClient({}), process.env.SERVICE_TOKENS_TABLE!);

const extractOutputFilePaths = (event: Event) => {
    const {detail: {outputGroupDetails: [{outputDetails: [{outputFilePaths}]}]}} = event;
    return outputFilePaths;
}

const handleMediaConvertEvent = async (event: Event) => {
    const {Item} = await db.getItem({Id: event.detail.jobId});
    if (!Item)
        return
    if (event.detail.status === "ERROR") {
        return await sfn.send(new SendTaskFailureCommand({
            taskToken: Item.TaskToken
        }));
    }
    return sfn.send(new SendTaskSuccessCommand({
        taskToken: Item.TaskToken,
        output: JSON.stringify(event)
    }));
}

const handleTranscribeEvent = async (event: Event) => {
    const {Item} = await db.getItem({Id: event.detail.TranscriptionJobName});
    if (!Item)
        return
    if (event.detail.TranscriptionJobStatus === "FAILED") {
        return await sfn.send(new SendTaskFailureCommand({
            taskToken: Item.TaskToken
        }));
    }
    const {TaskOutput} = Item;
    const [outputFilePath] = extractOutputFilePaths(JSON.parse(TaskOutput));
    const mediaConvertS3Directory = PATH.parse(outputFilePath).dir;
    const prefix = PATH.parse(mediaConvertS3Directory).dir.split("/").slice(3).join("/");

    return sfn.send(new SendTaskSuccessCommand({
        taskToken: Item.TaskToken,
        output: JSON.stringify({
            mediaConvert: JSON.parse(Item.TaskOutput),
            transcribe: event,
            hls: `https://${process.env.CLOUDFRONT_DOMAIN_NAME}/${prefix}/media/hls/master.m3u8`,
            srt: `https://${process.env.CLOUDFRONT_DOMAIN_NAME}/${prefix}/mediaconvert/${event.detail.TranscriptionJobName}.srt`,
            vtt: `https://${process.env.CLOUDFRONT_DOMAIN_NAME}/${prefix}/mediaconvert/${event.detail.TranscriptionJobName}.vtt`
        })
    }));
}

const services = {
    "aws.mediaconvert": handleMediaConvertEvent,
    "aws.transcribe": handleTranscribeEvent
}


export const handler = async (event: Event) => {
    console.log(JSON.stringify(event, null, 2))
    const missingEnv = REQUIRED_ENVS.filter((name) => !process.env[name])
    if (missingEnv.length)
        throw new Error(`Missing the following env variables: ${missingEnv.join(', ')}`)

    try {
        return services[event.source as keyof typeof services](event)
    } catch (e) {
        console.error(e)
        return e;
    }
}
