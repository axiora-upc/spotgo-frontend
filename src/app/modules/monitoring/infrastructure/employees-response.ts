/*
  Transport DTOs for the /employees endpoint.

  EmployeesResource is the shape of one item as the API serializes it.
  We keep it separate from the Employee entity so that backend changes
  (renames, type widening, etc.) only affect this file and the
  assembler that translates between them.

  EmployeesResponse is reserved for the case where the API wraps the
  array in a container (e.g. `{ content: [...] }`). JSON Server today
  returns a plain array so this interface is unused, but we keep it to
  fit the BaseApiEndpoint contract.
*/
import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface EmployeesResource extends BaseResource {
  id: string;
  firstName: string;
  lastName: string;
  parkingId?: number;
  role: string;
  schedule: string;
  shiftStart: string;
  shiftEnd: string;
  status: string;
  bookingCode?: string;
}

export interface EmployeesResponse extends BaseResponse {
  employees: EmployeesResource[];
}
