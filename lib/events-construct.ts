import {Construct} from "constructs";
import {Rule, RuleProps} from "aws-cdk-lib/aws-events";
import {LambdaFunction, SfnStateMachine} from "aws-cdk-lib/aws-events-targets";
import {IFunction} from "aws-cdk-lib/aws-lambda";
import {ILambdaFunctions} from "./interfaces";
import {IStateMachine} from "aws-cdk-lib/aws-stepfunctions";

interface Props {
    ivsChannelArn: string;
    lambdaFunctions: ILambdaFunctions;
    mediaConvertId: string;
    stateMachine: IStateMachine;
}

export class EventsConstruct extends Construct {
    private readonly ivsRule: Rule;
    private readonly mediaConvertRule: Rule;
    private readonly transcribeRule: Rule;

    constructor(scope: Construct, id: string, props: Props) {
        super(scope, id);

        // Create EventBridge rule
        this.ivsRule = this.createRule('Ivs', {
            eventPattern: {
                source: ["aws.ivs"],
                detailType: ["IVS Recording State Change"],
                resources: [props.ivsChannelArn],
                detail: {
                    "recording_status": ["Recording End"]
                }
            },
        })
        this.mediaConvertRule = this.createRule('MediaConvert', {
            eventPattern: {
                source: ["aws.mediaconvert"],
                detailType: ["MediaConvert Job State Change"],
                detail: {
                    "userMetadata": {
                        "id": [props.mediaConvertId]
                    },
                    "status": ["COMPLETE", "ERROR"],
                }
            },
        })
        this.transcribeRule = this.createRule('Transcribe', {
            eventPattern: {
                source: ["aws.transcribe"],
                detailType: ["Transcribe Job State Change"],
                detail: {
                    "TranscriptionJobStatus": ["COMPLETED"]
                }
            },
        })
        EventsConstruct.addFnTarget(this.mediaConvertRule, props.lambdaFunctions.eventWatcher)
        EventsConstruct.addFnTarget(this.transcribeRule, props.lambdaFunctions.eventWatcher)
        EventsConstruct.addStateMachineTarget(this.ivsRule, props.stateMachine)
    }

    private createRule(id: string, props?: RuleProps) {
        return new Rule(this, id, props);
    }

    private static addStateMachineTarget(target: Rule, stateMachine: IStateMachine) {
        target.addTarget(new SfnStateMachine(stateMachine));
    }

    private static addFnTarget(target: Rule, fn: IFunction) {
        target.addTarget(new LambdaFunction(fn));
    }
}
