/*
  Transport DTOs for the /incidents endpoint.
*/
import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface IncidentsResource extends BaseResource {
  id: string;
  type: string;
  spot: string;
  date: string;
  time: string;
  severity: string;
}

export interface IncidentsResponse extends BaseResponse {
  incidents: IncidentsResource[];
}
