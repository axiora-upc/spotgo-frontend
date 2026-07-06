/*
  ParkingForHistory is the domain entity that maps to what the /parkings
  endpoint returns, scoped to the fields the history view needs.

  It carries all parking fields (not just name) because when a client
  rates a reservation, HistoryStore must update the parking's average
  rating via PUT /parkings/:id. Since backend replaces the whole
  document on PUT, the entity must include every field that should be
  preserved — sending only { id, rating } would delete address, price, etc.

  It implements BaseEntity so ParkingsHistoryApiEndpoint (extends
  BaseApiEndpoint) can use it as a typed entity, enabling .update().
*/
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export class ParkingForHistory implements BaseEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly address: string,
    public readonly availableSpaces: number,
    public readonly rating: number,          // stored as the running average
    public readonly pricePerHour: number,
  ) {}
}
