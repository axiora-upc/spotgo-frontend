/*
  Assembler that translates between the ClientPlan domain entity and the
  ClientPlanResource / ClientPlanResponse transport DTOs.

  This is the only file allowed to know about both worlds at the same
  time. The domain (ClientPlan) does not know the API exists, and the
  HTTP endpoint only deals with Resources. The assembler bridges them.
*/
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { ClientPlan, PlanType } from '../domain/model/client-plan.entity';
import { ClientPlanResource, ClientPlanResponse } from './client-plan-response';

export class ClientPlanAssembler
  implements BaseAssembler<ClientPlan, ClientPlanResource, ClientPlanResponse>
{
  /*
    Converts one raw API resource into a ClientPlan domain entity.

    The type field comes as a plain string from the API, so we cast it
    to PlanType — the same pattern used across all assemblers in the project.

    features uses ?? [] as a fallback in case the API does not return
    that field, so the entity never holds undefined.
  */
  toEntityFromResource(resource: ClientPlanResource): ClientPlan {
    return new ClientPlan({
      id: resource.id,
      type: resource.type as PlanType,
      name: resource.name,
      monthlyPrice: resource.monthlyPrice,
      description: resource.description,
      reservationsPerMonth: resource.reservationsPerMonth,
      features: resource.features ?? [],
    });
  }

  /*
    Converts a ClientPlan domain entity back into a resource.
    Client plans are read-only from the client side, so this method
    is included only to satisfy the BaseAssembler contract.
  */
  toResourceFromEntity(entity: ClientPlan): ClientPlanResource {
    return {
      id: entity.id,
      type: entity.type,
      name: entity.name,
      monthlyPrice: entity.monthlyPrice,
      description: entity.description,
      reservationsPerMonth: entity.reservationsPerMonth,
      features: entity.features,
    } as ClientPlanResource;
  }

  /*
    Converts a wrapped API response into an array of entities.
    JSON Server returns a plain array today, so this method is used
    only if the API ever wraps the response in an object.
  */
  toEntitiesFromResponse(response: ClientPlanResponse): ClientPlan[] {
    return response.clientPlans.map((r) => this.toEntityFromResource(r));
  }
}
