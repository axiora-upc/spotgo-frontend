/*
  Assembler that translates between the Subscription domain entity and the
  SubscriptionResource / SubscriptionResponse transport DTOs.

  This is the only file allowed to know about both worlds at the same
  time. The domain (Subscription) does not know the API exists, and the
  HTTP endpoint only deals with Resources. The assembler bridges them.
*/
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { Subscription, SubscriptionStatus } from '../domain/model/subscription.entity';
import { SubscriptionResource, SubscriptionResponse } from './subscription-response';

export class SubscriptionAssembler
  implements BaseAssembler<Subscription, SubscriptionResource, SubscriptionResponse>
{
  /*
    Converts one raw API resource into a Subscription domain entity.
    The status field comes as a plain string from the API, so we cast
    it to SubscriptionStatus — the same pattern used by EmployeeAssembler
    for role and status fields.
  */
  toEntityFromResource(resource: SubscriptionResource): Subscription {
    return new Subscription({
      id: resource.id ?? '',
      clientId: resource.clientId ?? '',
      planId: resource.planId,
      /**
       * "as" is a TypeScript type assertion
       *  that tells the compiler to
       *  treat resource.status as if it were
       *  of type SubscriptionStatus.
       */
      status: resource.status.toLowerCase() as SubscriptionStatus,
      renewsOn: resource.renewsOn ?? '',
      pricePerMonth: resource.pricePerMonth ?? 0,
      sessions: resource.sessions ?? 0,
      savedThisMonth: resource.savedThisMonth ?? 0,
      savingsMonth: resource.savingsMonth ?? '',
      memberSince: resource.memberSince ?? '',
      autoRenewal: resource.autoRenewal,
      paymentMethodLastFour: resource.paymentMethodLastFour ?? '',
      paymentMethodExpiry: resource.paymentMethodExpiry ?? '',
    });
  }

  /*
    Converts a Subscription domain entity back into a resource to send
    to the API (used on PUT/PATCH when updating a subscription, e.g.
    toggling autoRenewal).
  */
  toResourceFromEntity(entity: Subscription): SubscriptionResource {
    return {
      planId: entity.planId,
      autoRenewal: entity.autoRenewal,
      paymentMethodLastFour: entity.paymentMethodLastFour,
      paymentMethodExpiry: entity.paymentMethodExpiry,
    } as SubscriptionResource;
  }

  /*
    Converts a wrapped API response into an array of entities.
    JSON Server returns a plain array today, so this method is used
    only if the API ever wraps the response in an object.
  */
  toEntitiesFromResponse(response: SubscriptionResponse): Subscription[] {
    return response.subscriptions.map((r) => this.toEntityFromResource(r));
  }
}
