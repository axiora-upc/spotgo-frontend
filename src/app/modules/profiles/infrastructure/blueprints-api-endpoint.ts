import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { Blueprint } from '../domain/model/blueprint.entity';
import { BlueprintResource, BlueprintResponse } from './blueprint-response';
import { BlueprintAssembler } from './blueprint-assembler';

/*
  Concrete HTTP endpoint for the /blueprints resource.

  Inherits getAll / create / delete from BaseApiEndpoint – we only need
  to wire the URL and the assembler.
*/
export class BlueprintsApiEndpoint extends BaseApiEndpoint<
  Blueprint,
  BlueprintResource,
  BlueprintResponse,
  BlueprintAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.apiUrl}/blueprints`,
      new BlueprintAssembler()
    );
  }
}
