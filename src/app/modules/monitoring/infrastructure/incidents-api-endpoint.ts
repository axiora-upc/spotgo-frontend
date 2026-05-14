/*
  Concrete API endpoint for the /incidents resource.
*/
import { HttpClient } from '@angular/common/http';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { IncidentReport } from '../domain/model/incident-report.entity';
import { IncidentsResource, IncidentsResponse } from './incidents-response';
import { IncidentReportAssembler } from './incident-report-assembler';

export class IncidentsApiEndpoint extends BaseApiEndpoint<
  IncidentReport,
  IncidentsResource,
  IncidentsResponse,
  IncidentReportAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      'http://localhost:3000/incidents',
      new IncidentReportAssembler()
    );
  }
}
