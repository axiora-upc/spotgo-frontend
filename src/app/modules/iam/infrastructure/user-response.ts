import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/*
  UserResource is the raw shape returned by the /users resource.

  Note: password only exists here (transport DTO) — it never becomes part
  of the User domain entity, since the entity represents the authenticated
  identity, not the credential.
*/
export interface UserResource extends BaseResource {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  role: 'admin' | 'client';
  parkingName: string;
  parkingId: string | null;
}

export interface AuthenticatedUserResource extends UserResource {
  token: string;
}

export interface UserResponse extends BaseResponse {
  users: UserResource[];
}
