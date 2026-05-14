/*
  This class handles all HTTP calls to /clientPlans.

  It does NOT write any HTTP logic — it inherits getAll(), getById(),
  update(), delete() and create() from BaseApiEndpoint (the parent class).

  Client plans are read-only from the client side, so only getAll()
  will be used in practice. The rest are inherited but never called.
*/
import { HttpClient } from '@angular/common/http';

/*
  environment.apiUrl builds the base URL automatically:
    In development: http://localhost:3000
    In production: the real server URL
*/
import { environment } from '../../../../environments/environment';

/*
  BaseApiEndpoint is the parent class. It contains all the HTTP logic.
  By extending it, this class inherits getAll(), getById(), update(), etc.
  without writing any of that code here.
*/
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { ClientPlan } from '../domain/model/client-plan.entity';
import { ClientPlanResource, ClientPlanResponse } from './client-plan-response';
import { ClientPlanAssembler } from './client-plan-assembler';

/*
  The generics tell the parent class what types to work with:
    ClientPlan         — the final typed object returned to the store
    ClientPlanResource — the raw JSON object the API returns
    ClientPlanResponse — the shape if the API wraps the array in an object
    ClientPlanAssembler — the class that translates between JSON and entity
*/
export class ClientPlansApiEndpoint extends BaseApiEndpoint<
  ClientPlan,
  ClientPlanResource,
  ClientPlanResponse,
  ClientPlanAssembler
> {
  /*
    super() passes the 3 required things to the parent so it can work:
      http                         — the tool to make HTTP calls
      environment.apiUrl/clientPlans — builds http://localhost:3000/clientPlans
      new ClientPlanAssembler()    — the translator to convert JSON to ClientPlan

    After this, calling getAll() will automatically do:
      GET http://localhost:3000/clientPlans and return ClientPlan[]
  */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.apiUrl}/clientPlans`,
      new ClientPlanAssembler()
    );
  }
}
