/*
  ParkingForFavorites is the domain entity that maps 1-to-1 with what
  the /parkings endpoint returns when loading data for the favorites view.

  It only knows about the parking itself:
    - its name and address (for display)
    - how many spaces are currently available (the green badge)
    - its rating and price per hour (the meta row)

  It does NOT know who saved it as a favorite or when.
  That information belongs to FavoriteRaw.

  The name "ForFavorites" is intentional: parkings are also used in other
  parts of the app (admin dashboard, reservations). This entity only
  carries the fields the favorites view needs, keeping it focused and
  decoupled from the fuller parking models used elsewhere.

  It implements BaseEntity so ParkingsApiEndpoint (which extends
  BaseApiEndpoint) can work with it as a typed entity.
*/
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export class ParkingForFavorites implements BaseEntity {
  /*
    Like FavoriteRaw, this uses public readonly constructor parameters
    because this is an intermediate entity used only during the join
    in FavoritesStore. It is never mutated after construction.
  */
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly address: string,
    public readonly availableSpaces: number,
    public readonly rating: number,
    public readonly pricePerHour: number,
  ) {}
}
