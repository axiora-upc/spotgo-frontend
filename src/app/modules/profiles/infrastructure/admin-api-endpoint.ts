import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { Admin } from '../domain/model/admin.entity';
import { AdminResource, AdminResponse } from './admin-response';
import { AdminAssembler } from './admin-assembler';

export class AdminApiEndpoint extends BaseApiEndpoint<
  Admin,
  AdminResource,
  AdminResponse,
  AdminAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.apiUrl}/users`,
      new AdminAssembler()
    );
  }
}
