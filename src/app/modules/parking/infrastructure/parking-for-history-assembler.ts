/*
  Assembler between ParkingForHistory (domain) and ParkingForHistoryResource (API DTO).

  toEntityFromResource is called by BaseApiEndpoint.getAll() when loading
  all parkings to build the join with reservations.

  toResourceFromEntity is called by BaseApiEndpoint.update() when HistoryStore
  persists the recalculated average rating back to /parkings/:id.
  All fields must be included to prevent json-server from deleting them on PUT.
*/
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { ParkingForHistory } from '../domain/model/parking-for-history.entity';
import {
  ParkingForHistoryResource,
  ParkingForHistoryResponse,
} from './parking-for-history-response';

export class ParkingForHistoryAssembler
  implements BaseAssembler<ParkingForHistory, ParkingForHistoryResource, ParkingForHistoryResponse>
{
  toEntityFromResource(r: ParkingForHistoryResource): ParkingForHistory {
    return new ParkingForHistory(
      r.id,
      r.name,
      r.address,
      r.availableSpaces,
      r.rating ?? 0,
      r.pricePerHour ?? 0,
    );
  }

  toResourceFromEntity(e: ParkingForHistory): ParkingForHistoryResource {
    return {
      id: e.id,
      name: e.name,
      address: e.address,
      availableSpaces: e.availableSpaces,
      rating: e.rating,
      pricePerHour: e.pricePerHour,
    };
  }

  toEntitiesFromResponse(response: ParkingForHistoryResponse): ParkingForHistory[] {
    return response.parkings.map(r => this.toEntityFromResource(r));
  }
}
