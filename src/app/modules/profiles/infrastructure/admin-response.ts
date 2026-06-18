import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface AdminResource extends BaseResource {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  parkingName: string;
  parkingId: string | null;
}

export interface AdminResponse extends BaseResponse {
  users: AdminResource[];
}
