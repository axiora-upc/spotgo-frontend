import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { Admin } from '../domain/model/admin.entity';
import { AdminResource, AdminResponse } from './admin-response';

/*
  AdminAssembler translates between the Admin domain entity and the
  AdminResource / AdminResponse transport DTOs.

  It is the only file allowed to know about both worlds simultaneously.
*/
export class AdminAssembler
  implements BaseAssembler<Admin, AdminResource, AdminResponse>
{
  toEntityFromResource(resource: AdminResource): Admin {
    return new Admin({
      id:          resource.id,
      firstName:   resource.firstName,
      lastName:    resource.lastName,
      email:       resource.email,
      phone:       resource.phone,
      parkingName: resource.parkingName,
      parkingId:   resource.parkingId,
    });
  }

  toResourceFromEntity(entity: Admin): AdminResource {
    return {
      id:          entity.id,
      firstName:   entity.firstName,
      lastName:    entity.lastName,
      email:       entity.email,
      phone:       entity.phone,
      parkingName: entity.parkingName,
      parkingId:   entity.parkingId,
    };
  }

  toEntitiesFromResponse(response: AdminResponse): Admin[] {
    return response.users.map(r => this.toEntityFromResource(r));
  }
}
