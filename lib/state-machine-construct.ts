import {Construct} from "constructs";
import {StateMachine} from "aws-cdk-lib/aws-stepfunctions";
import {LambdaInvoke} from "aws-cdk-lib/aws-stepfunctions-tasks";
import {IFunction} from "aws-cdk-lib/aws-lambda";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {RetentionDays} from "aws-cdk-lib/aws-logs";

export class StateMachineConstruct extends Construct {
    private stateMachine: any;
    private transcribeFn: NodejsFunction;
    private mediaConvertFn: NodejsFunction;

    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.createFn();
        this.createDefinition();
    }

    private createDefinition() {
        const startMediaConvertJob = new LambdaInvoke(this, 'Start MediaConvert Job and Wait', {
            lambdaFunction: this.mediaConvertFn
        })
        const startTranscribeJob = new LambdaInvoke(this, 'Start Transcribe Job and Wait', {
            lambdaFunction: this.transcribeFn
        })
        const definition = startMediaConvertJob.next(startTranscribeJob)
        this.stateMachine = new StateMachine(this, 'Definition', {
            definition
        })
    }

    private createFn() {
        const props = {
            logRetention: RetentionDays.THREE_DAYS,
        }

        this.transcribeFn = new NodejsFunction(this, 'Transcribe', {
            entry: 'lambda/transcribe/index.ts',
            ...props
        });
        this.mediaConvertFn = new NodejsFunction(this, 'MediaConvert', {
            entry: 'lambda/media-convert/index.ts',
            ...props
        });
    }
}
