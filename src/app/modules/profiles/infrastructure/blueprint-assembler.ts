import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { Blueprint } from '../domain/model/blueprint.entity';
import { BlueprintResource, BlueprintResponse } from './blueprint-response';

/*
  BlueprintAssembler translates between the Blueprint domain entity and the
  BlueprintResource / BlueprintResponse transport DTOs.

  It is the only file allowed to know about both worlds simultaneously.
*/
export class BlueprintAssembler
  implements BaseAssembler<Blueprint, BlueprintResource, BlueprintResponse>
{
  toEntityFromResource(resource: BlueprintResource): Blueprint {
    return new Blueprint({
      id:        resource.id,
      adminId:   resource.adminId,
      parkingId: resource.parkingId,
      name:      resource.name,
      dataUrl:   resource.dataUrl,
      spots:     [],
    });
  }

  toResourceFromEntity(entity: Blueprint): BlueprintResource {
    return {
      id:        entity.id,
      adminId:   entity.adminId,
      parkingId: entity.parkingId,
      name:      entity.name,
      dataUrl:   entity.dataUrl,
    };
  }

  toEntitiesFromResponse(response: BlueprintResponse): Blueprint[] {
    return response.blueprints.map(r => this.toEntityFromResource(r));
  }
}
