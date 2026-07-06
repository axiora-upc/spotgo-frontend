/*
  Concrete API endpoint for the /employees resource.

  By extending BaseApiEndpoint we get getAll / getById / create /
  update / delete for free, with consistent error handling and
  resource <-> entity translation. We only need to wire the URL and
  the assembler in the constructor.

  Note about ids: backend 1.0 ignores the id field in the request
  body during POST and generates its own (a nanoid). The id we
  generate client-side in EmployeeForm is therefore overwritten by the
  server response. The Store reads the canonical record returned by
  POST, so the UI always shows the id that lives in db.json.
*/
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { Employee } from '../domain/model/employee.entity';
import { EmployeesResource, EmployeesResponse } from './employees-response';
import { EmployeeAssembler } from './employee-assembler';

export class EmployeesApiEndpoint extends BaseApiEndpoint<
  Employee,
  EmployeesResource,
  EmployeesResponse,
  EmployeeAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.apiUrl}/employees`,
      new EmployeeAssembler()
    );
  }
}
