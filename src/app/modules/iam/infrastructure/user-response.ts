import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/*
  UserResource is the raw shape of one row of the /users resource in the
  mock backend (server/db.json).

  Note: password only exists here (transport DTO) — it never becomes part
  of the User domain entity, since the entity represents the authenticated
  identity, not the credential.
*/
export interface UserResource extends BaseResource {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone: string;
  city: string;
  parkingName: string;
  parkingId: string | null;
}

export interface UserResponse extends BaseResponse {
  users: UserResource[];
}
