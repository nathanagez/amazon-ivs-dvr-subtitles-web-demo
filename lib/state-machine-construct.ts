import {Construct} from "constructs";
import {IntegrationPattern, JsonPath, StateMachine, TaskInput} from "aws-cdk-lib/aws-stepfunctions";
import {LambdaInvoke, SnsPublish} from "aws-cdk-lib/aws-stepfunctions-tasks";
import {ILambdaFunctions} from "./interfaces";
import {IGrantable} from "aws-cdk-lib/aws-iam";
import {ITopic} from "aws-cdk-lib/aws-sns";

interface Props {
    lambdaFunctions: ILambdaFunctions
    topic: ITopic;
}

export class StateMachineConstruct extends Construct {
    public readonly stateMachine: StateMachine;

    constructor(scope: Construct, id: string, props: Props) {
        super(scope, id);
        this.stateMachine = new StateMachine(this, 'SubtitlesGeneration', {
            definition: this.createDefinition(props)
        })
    }

    private createDefinition(props: Props) {
        const startMediaConvertJob = new LambdaInvoke(this, 'Start MediaConvert Job and Wait', {
            lambdaFunction: props.lambdaFunctions.mediaConvert,
            payload: TaskInput.fromObject({
                'input.$': '$',
                taskToken: JsonPath.taskToken,
            }),
            integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
        })
        const startTranscribeJob = new LambdaInvoke(this, 'Start Transcribe Job and Wait', {
            lambdaFunction: props.lambdaFunctions.transcribe,
            payload: TaskInput.fromObject({
                'input.$': '$',
                taskToken: JsonPath.taskToken,
            }),
            resultSelector: {
                "mediaConvert.$": "$.mediaConvert",
                "transcribe.$": "$.transcribe",
                "hls.$": "$.hls",
                "srt.$": "$.srt",
                "vtt.$": "$.vtt"
            },
            integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
        })
        const publishToSns = new SnsPublish(this, 'Publish to SNS', {
            topic: props.topic,
            message: TaskInput.fromObject({
                hls: JsonPath.stringAt("$.hls"),
                srt: JsonPath.stringAt("$.srt"),
                vtt: JsonPath.stringAt("$.vtt"),
            })
        });
        return startMediaConvertJob.next(startTranscribeJob.next(publishToSns))
    }

    grantTaskResponse(identity: IGrantable) {
        this.stateMachine.grantTaskResponse(identity)
    }
}
