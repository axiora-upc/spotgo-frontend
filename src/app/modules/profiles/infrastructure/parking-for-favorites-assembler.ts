/*
  Assembler that translates between ParkingForFavorites and the raw
  ParkingForFavoritesResource DTO returned by the /parkings endpoint.

  It reads only the fields the favorites view needs (name, address,
  availableSpaces, rating, pricePerHour) and ignores everything else
  the API returns (adminId, totalFloors, systemStatus, etc.).

  toResourceFromEntity is implemented to satisfy the BaseAssembler
  contract but is not called — parkings are read-only in this context.
*/
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { ParkingForFavorites } from '../domain/model/parking-for-favorites.entity';
import {
  ParkingForFavoritesResource,
  ParkingForFavoritesResponse,
} from './parking-for-favorites-response';

export class ParkingForFavoritesAssembler
  implements BaseAssembler<ParkingForFavorites, ParkingForFavoritesResource, ParkingForFavoritesResponse>
{
  toEntityFromResource(r: ParkingForFavoritesResource): ParkingForFavorites {
    return new ParkingForFavorites(
      r.id,
      r.name,
      r.address,
      r.availableSpaces,
      r.rating,
      r.pricePerHour,
    );
  }

  toResourceFromEntity(e: ParkingForFavorites): ParkingForFavoritesResource {
    return {
      id: e.id,
      name: e.name,
      address: e.address,
      availableSpaces: e.availableSpaces,
      rating: e.rating,
      pricePerHour: e.pricePerHour,
    };
  }

  toEntitiesFromResponse(response: ParkingForFavoritesResponse): ParkingForFavorites[] {
    return response.parkings.map(r => this.toEntityFromResource(r));
  }
}
