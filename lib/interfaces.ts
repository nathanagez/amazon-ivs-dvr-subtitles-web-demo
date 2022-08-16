import {IFunction} from "aws-cdk-lib/aws-lambda";

export interface ILambdaFunctions {
    mediaConvert: IFunction,
    transcribe: IFunction,
    eventWatcher: IFunction,
}
