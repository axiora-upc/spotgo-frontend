/*
  Transport DTOs for the /parkings endpoint, scoped to the history context.

  ParkingForHistoryResource declares all parking fields that HistoryStore
  needs to (a) build the join and (b) update the parking's rating via PUT.
  The PUT operation requires the full document — partial fields would
  delete the rest in json-server.

  ParkingForHistoryResponse is unused (plain array) but required by
  the BaseApiEndpoint generic contract.
*/
import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface ParkingForHistoryResource extends BaseResource {
  id: string;
  name: string;
  address: string;
  availableSpaces: number;
  rating: number;
  pricePerHour: number;
}

export interface ParkingForHistoryResponse extends BaseResponse {
  parkings: ParkingForHistoryResource[];
}
