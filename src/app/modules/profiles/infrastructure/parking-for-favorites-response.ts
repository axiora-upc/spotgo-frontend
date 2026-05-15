/*
  Transport DTOs for the /parkings endpoint, scoped to the favorites context.

  ParkingForFavoritesResource only declares the parking fields that the
  favorites view needs (name, address, availableSpaces, rating, pricePerHour).
  Other parking fields (adminId, totalFloors, systemStatus, etc.) exist in
  db.json but are ignored here — the assembler simply does not read them.

  ParkingForFavoritesResponse is reserved for the case where the API
  wraps the array. JSON Server returns a plain array today so it is
  unused, but required by the BaseApiEndpoint contract.
*/
import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface ParkingForFavoritesResource extends BaseResource {
  id: string;
  name: string;
  address: string;
  availableSpaces: number;
  rating: number;
  pricePerHour: number;
}

export interface ParkingForFavoritesResponse extends BaseResponse {
  parkings: ParkingForFavoritesResource[];
}
