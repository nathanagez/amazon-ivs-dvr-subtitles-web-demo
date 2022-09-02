import {Construct} from "constructs";
import {Subscription, SubscriptionProtocol, Topic} from "aws-cdk-lib/aws-sns";

interface Props {
    email: string;
}

export class SnsConstruct extends Construct {
    public readonly topic: Topic;
    constructor(scope: Construct, id: string, props: Props) {
        super(scope, id);

        this.topic = this.createSnsTopic('Topic');
        this.addSubscription(this.topic, props.email, 'Subscription')
    }

    private createSnsTopic(id: string) {
        return new Topic(this, id)
    }

    private addSubscription(topic: Topic, endpoint: string, id: string) {
        return new Subscription(this, id, {
            topic,
            endpoint,
            protocol: SubscriptionProtocol.EMAIL,
        });
    }
}
