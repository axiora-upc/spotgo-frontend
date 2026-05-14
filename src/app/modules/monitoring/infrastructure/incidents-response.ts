/*
  Transport DTOs for the /incidents endpoint.
*/
import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface IncidentsResource extends BaseResource {
  id: string;
  code: string;
  type: string;
  spot: string;
  date: string;
  time: string;
  status?: string;
  severity: string;
}

export interface IncidentsResponse extends BaseResponse {
  incidents: IncidentsResource[];
}
