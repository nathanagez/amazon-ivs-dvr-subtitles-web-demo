import {Construct} from "constructs";
import {NodejsFunction, NodejsFunctionProps} from "aws-cdk-lib/aws-lambda-nodejs";
import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {Code, LayerVersion, Runtime} from "aws-cdk-lib/aws-lambda";
import {ManagedPolicy, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Duration} from "aws-cdk-lib";

interface Props {
    mediaConvertId: string;
    tableName: string;
    cloudFrontDomainName: string;
}

export class LambdaConstruct extends Construct {
    private readonly eventWatcherFn: NodejsFunction;
    private readonly mediaConvertFn: NodejsFunction;
    private readonly transcribeFn: NodejsFunction;
    private readonly utilLayer: LayerVersion;
    private readonly mediaConvertRole: Role;

    constructor(scope: Construct, id: string, props: Props) {
        super(scope, id);
        // Create layers
        this.utilLayer = this.createLayer('utils', 'Utils', 'Utils layer');

        // Create roles
        this.mediaConvertRole = this.createIamRole('mediaconvert.amazonaws.com', 'MediaConvertRole');

        // Then create Lambda functions
        this.eventWatcherFn = this.createLambdaFn('event-watcher', 'EventWatcher', {
            environment: {
                SERVICE_TOKENS_TABLE: props.tableName,
                CLOUDFRONT_DOMAIN_NAME: props.cloudFrontDomainName
            },
            timeout: Duration.seconds(15)
        });
        this.transcribeFn = this.createLambdaFn('transcribe', 'Transcribe', {
            timeout: Duration.seconds(15),
            environment: {
                SERVICE_TOKENS_TABLE: props.tableName
            },
        });
        this.mediaConvertFn = this.createLambdaFn('media-convert', 'MediaConvert', {
            environment: {
                MC_ROLE: this.mediaConvertRole.roleArn,
                MC_ID: props.mediaConvertId,
                SERVICE_TOKENS_TABLE: props.tableName
            }
        });
        this.transcribeFn.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonTranscribeFullAccess'))
        this.mediaConvertFn.role?.grantPassRole(this.mediaConvertRole)
        this.mediaConvertFn.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSElementalMediaConvertFullAccess'))
    }

    private createLayer(directoryName: string, id: string, description: string) {
        return new LayerVersion(this, id, {
            compatibleRuntimes: [
                Runtime.NODEJS_14_X,
            ],
            code: Code.fromAsset(`lambda/layers/${directoryName}`),
            description,
        });
    }

    private createIamRole(principal: string, id: string) {
        return new Role(this, id, {
            assumedBy: new ServicePrincipal(principal),
        });
    }

    private createLambdaFn(directoryName: string, id: string, props?: NodejsFunctionProps) {
        return new NodejsFunction(this, id, {
            logRetention: RetentionDays.THREE_DAYS,
            entry: `lambda/${directoryName}/index.ts`,
            layers: [this.utilLayer],
            bundling: {
                minify: true,
                sourceMap: true
            },
            ...props,
            environment: {
                ...props?.environment,
                NODE_OPTIONS: '--enable-source-maps',
            }
        });
    }

    get functions() {
        return {
            mediaConvert: this.mediaConvertFn,
            transcribe: this.transcribeFn,
            eventWatcher: this.eventWatcherFn
        }
    }

    get roles() {
        return {
            mediaConvert: this.mediaConvertRole
        }
    }
}
