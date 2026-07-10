import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { User } from '../domain/model/user.entity';
import { UserResource, UserResponse } from './user-response';

/*
  UserAssembler translates between the raw UserResource (from /users) and
  the User domain entity.

  /users now returns the effective role directly from the backend.
*/
export class UserAssembler implements BaseAssembler<User, UserResource, UserResponse> {
  toEntityFromResource(resource: UserResource): User {
    return new User({
      id:          resource.id,
      firstName:   resource.firstName,
      lastName:    resource.lastName,
      email:       resource.email,
      phone:       resource.phone,
      parkingName: resource.parkingName,
      parkingId:   resource.parkingId,
      role:        resource.role,
    });
  }

  toResourceFromEntity(entity: User): UserResource {
    return {
      id:          entity.id,
      firstName:   entity.firstName,
      lastName:    entity.lastName,
      email:       entity.email,
      phone:       entity.phone,
      role:        entity.role,
      parkingName: entity.parkingName,
      parkingId:   entity.parkingId,
    };
  }

  toEntitiesFromResponse(response: UserResponse): User[] {
    return response.users.map(r => this.toEntityFromResource(r));
  }
}
