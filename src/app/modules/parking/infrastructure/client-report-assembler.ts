/*
  Assembler between ClientReport (domain) and ClientReportResource (API DTO).

  toResourceFromEntity is called by BaseApiEndpoint.create() when the
  user submits a report. The id is sent as '' and backend assigns
  a real id, which is returned in the response and converted back via
  toEntityFromResource.

  toEntitiesFromResponse is unused (reports are write-only from the client).
*/
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { ClientReport, ReportType } from '../domain/model/client-report.entity';
import { ClientReportResource, ClientReportResponse } from './client-report-response';

export class ClientReportAssembler
  implements BaseAssembler<ClientReport, ClientReportResource, ClientReportResponse>
{
  toEntityFromResource(r: ClientReportResource): ClientReport {
    return new ClientReport(
      r.id,
      r.code,
      r.clientId,
      r.parkingId,
      r.reservationId,
      r.type as ReportType,
      r.date,
      r.status,
    );
  }

  toResourceFromEntity(e: ClientReport): ClientReportResource {
    /*
      When creating a new report (id === ''), we omit the id field entirely
      so backend auto-generates one. Sending id: '' would cause backend
      to store the record with an empty string as the id, which breaks
      subsequent lookups. The cast to ClientReportResource is safe because
      backend fills in the id on POST and returns the full record.
    */
    const base = {
      code: e.code,
      clientId: e.clientId,
      parkingId: e.parkingId,
      reservationId: e.reservationId,
      type: e.type,
      date: e.date,
      status: e.status,
    };
    return (e.id ? { id: e.id, ...base } : base) as ClientReportResource;
  }

  toEntitiesFromResponse(response: ClientReportResponse): ClientReport[] {
    return response.clientReports.map(r => this.toEntityFromResource(r));
  }
}
