import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { User } from '../domain/model/user.entity';
import { UserResource, UserResponse } from './user-response';
import { UserAssembler } from './user-assembler';

/*
  UsersApiEndpoint handles HTTP calls to /users.

  It inherits getAll(), getById(), create(), update() and delete() from
  BaseApiEndpoint. The only addition here is findByEmail(), needed by the
  login flow to look up a user by their email before checking the password.
*/
export class UsersApiEndpoint extends BaseApiEndpoint<
  User,
  UserResource,
  UserResponse,
  UserAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.apiUrl}/users`,
      new UserAssembler()
    );
  }

  /*
    Returns the raw resource (not the assembled entity) because the caller
    (IamApi) still needs the password field to validate the login attempt,
    and the assembler intentionally drops it when converting to User.
  */
  findResourceByEmail(email: string): Observable<UserResource[]> {
    return this.http.get<UserResource[]>(`${this.endpointUrl}?email=${encodeURIComponent(email)}`);
  }

  /*
    Creates a user from a raw resource instead of a User entity.

    This is needed during registration because the payload includes a
    password field, which the User entity/assembler intentionally does
    not carry (see UserAssembler). BaseApiEndpoint.create() would strip
    it before sending the request, so we post the resource directly here.
  */
  createResource(resource: UserResource): Observable<UserResource> {
    return this.http.post<UserResource>(this.endpointUrl, resource);
  }
}
