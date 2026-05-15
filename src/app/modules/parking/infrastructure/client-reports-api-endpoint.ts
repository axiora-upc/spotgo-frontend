/*
  Handles all HTTP calls to /clientReports.

  Inherits create() from BaseApiEndpoint:
    create(entity) → POST /clientReports → ClientReport
      (used when the client submits a report from a history card;
       json-server assigns the id and returns the persisted record)
*/
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { ClientReport } from '../domain/model/client-report.entity';
import { ClientReportResource, ClientReportResponse } from './client-report-response';
import { ClientReportAssembler } from './client-report-assembler';

export class ClientReportsApiEndpoint extends BaseApiEndpoint<
  ClientReport,
  ClientReportResource,
  ClientReportResponse,
  ClientReportAssembler
> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/clientReports`, new ClientReportAssembler());
  }
}
