import {Construct} from "constructs";
import {Rule, RuleProps} from "aws-cdk-lib/aws-events";
import {NodejsFunction, NodejsFunctionProps} from "aws-cdk-lib/aws-lambda-nodejs";
import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {LambdaFunction, LambdaFunctionProps} from "aws-cdk-lib/aws-events-targets";
import {IFunction} from "aws-cdk-lib/aws-lambda";

export class EventBridgeRules extends Construct {
    private readonly target: NodejsFunction;
    private rule: Rule;

    constructor(scope: Construct, id: string) {
        super(scope, id);
    }

    createRule(props?: RuleProps, id: string = 'IvsRule') {
        this.rule = new Rule(this, id, props);
    }

    createFnTarget(props?: NodejsFunctionProps, id: string = 'TargetFn') {
        return new NodejsFunction(this, id, {
            logRetention: RetentionDays.THREE_DAYS,
            entry: 'lambda/media-convert/index.ts',
            ...props
        });
    }

    addFnTarget(fn: IFunction, props?: LambdaFunctionProps) {
        this.rule.addTarget(new LambdaFunction(fn, props));
    }
}
