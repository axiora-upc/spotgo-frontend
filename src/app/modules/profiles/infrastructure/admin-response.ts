import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/*
  Transport DTOs for the /admins endpoint (json-server).

  AdminResource mirrors the JSON shape stored in db.json.
  We only declare the fields the Settings view actually reads or writes;
  unknown fields (password, sensors, etc.) are left out intentionally.
*/
export interface AdminResource extends BaseResource {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  parkingName: string;
  city: string;
}

/*
  AdminResponse is kept for BaseApiEndpoint contract compliance.
  json-server returns a plain array, so this interface is not used
  at runtime, but the generic constraint requires it.
*/
export interface AdminResponse extends BaseResponse {
  admins: AdminResource[];
}
