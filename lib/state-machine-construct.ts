import {Construct} from "constructs";
import {IntegrationPattern, JsonPath, StateMachine, TaskInput} from "aws-cdk-lib/aws-stepfunctions";
import {LambdaInvoke} from "aws-cdk-lib/aws-stepfunctions-tasks";
import {ILambdaFunctions} from "./interfaces";
import {IGrantable} from "aws-cdk-lib/aws-iam";

interface Props {
    lambdaFunctions: ILambdaFunctions
}

export class StateMachineConstruct extends Construct {
    public readonly stateMachine: StateMachine;

    constructor(scope: Construct, id: string, props: Props) {
        super(scope, id);
        this.stateMachine = new StateMachine(this, 'Definition', {
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
            integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
        })
        return startMediaConvertJob.next(startTranscribeJob)
    }

    grantTaskResponse(identity: IGrantable) {
        this.stateMachine.grantTaskResponse(identity)
    }
}
