import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { Admin } from '../domain/model/admin.entity';
import { AdminResource, AdminResponse } from './admin-response';
import { AdminAssembler } from './admin-assembler';

/*
  Concrete HTTP endpoint for the /admins resource.

  Inherits getAll / getById / create / update / delete from
  BaseApiEndpoint – we only need to wire the URL and the assembler.
*/
export class AdminApiEndpoint extends BaseApiEndpoint<
  Admin,
  AdminResource,
  AdminResponse,
  AdminAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.apiUrl}/admins`,
      new AdminAssembler()
    );
  }
}
