/*
  Transport DTOs for the /clientReports endpoint.

  ClientReportResource mirrors the clientReports row in db.json.
  When creating a report, the id field is sent as '' and json-server
  replaces it with a generated id in the response.

  ClientReportResponse is unused (plain array) but required by the
  BaseApiEndpoint generic contract.
*/
import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface ClientReportResource extends BaseResource {
  id: string;
  clientId: string;
  parkingId: string;
  reservationId: string;
  type: string;
  date: string;
  status: string;
}

export interface ClientReportResponse extends BaseResponse {
  clientReports: ClientReportResource[];
}
