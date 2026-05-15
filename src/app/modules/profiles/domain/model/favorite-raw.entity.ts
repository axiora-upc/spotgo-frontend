/*
  FavoriteRaw is the domain entity that maps 1-to-1 with what the
  /favorites endpoint returns.

  It only knows about the relationship itself:
    - which client saved a parking spot (clientId)
    - which parking was saved (parkingId — a foreign key)
    - how far the parking is from the client (distanceMi)
    - when the client last visited it (lastVisited)

  It does NOT know the parking's name, address, price, or rating.
  Those belong to the Parking table and are fetched separately.
  The FavoritesStore joins this entity with ParkingForFavorites
  to produce the rich Favorite entity that the view consumes.

  It implements BaseEntity because BaseApiEndpoint (the parent
  class used by FavoritesApiEndpoint) requires TEntity to have
  at least an 'id' property.
*/
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export class FavoriteRaw implements BaseEntity {
  /*
    Constructor parameters are declared public and readonly so TypeScript
    automatically creates and exposes each field without needing private
    backing fields and explicit getters.

    This is intentionally simpler than Subscription or ClientPlan because
    FavoriteRaw is an intermediate entity — it is never shown directly in
    the view. It only lives long enough for the store to join it with
    ParkingForFavorites and build the full Favorite entity.
  */
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly parkingId: string,   // foreign key → parkings collection
    public readonly distanceMi: number,
    public readonly lastVisited: string, // ISO 8601 date string
  ) {}
}
