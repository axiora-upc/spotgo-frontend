import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { User } from '../domain/model/user.entity';
import { UserResource, UserResponse } from './user-response';

/*
  UserAssembler translates between the raw UserResource (from /users) and
  the User domain entity.

  It does not know the user's role — /users has no role column, roles live
  in the /userRoles join table. That is why role defaults to 'client' here
  and is overwritten by IamApi once it resolves the real role. Keeping the
  default explicit (instead of leaving it undefined) keeps User's
  constructor honest about always requiring a role.
*/
export class UserAssembler implements BaseAssembler<User, UserResource, UserResponse> {
  toEntityFromResource(resource: UserResource): User {
    return new User({
      id:          resource.id,
      firstName:   resource.firstName,
      lastName:    resource.lastName,
      email:       resource.email,
      phone:       resource.phone,
      city:        resource.city,
      parkingName: resource.parkingName,
      parkingId:   resource.parkingId,
      role:        'client',
    });
  }

  toResourceFromEntity(entity: User): UserResource {
    return {
      id:          entity.id,
      firstName:   entity.firstName,
      lastName:    entity.lastName,
      email:       entity.email,
      phone:       entity.phone,
      city:        entity.city,
      parkingName: entity.parkingName,
      parkingId:   entity.parkingId,
    };
  }

  toEntitiesFromResponse(response: UserResponse): User[] {
    return response.users.map(r => this.toEntityFromResource(r));
  }
}
