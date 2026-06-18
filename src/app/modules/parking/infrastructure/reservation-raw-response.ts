/*
  Transport DTOs for the /reservations endpoint.

  ReservationRawResource mirrors the reservations row in db.json exactly,
  including the rating field that is null when the client has not yet
  rated the parking session.

  ReservationRawResponse is unused (JSON Server returns a plain array)
  but required by the BaseApiEndpoint generic contract.
*/
import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface ReservationRawResource extends BaseResource {
  id: string;
  clientId: string;
  parkingId: string;
  code: string;
  spot: string;
  startDate: string;
  endDate: string;
  status: string;
  amount: number;
  baseAmount?: number;
  rating: number | null;
}

export interface ReservationRawResponse extends BaseResponse {
  reservations: ReservationRawResource[];
}
