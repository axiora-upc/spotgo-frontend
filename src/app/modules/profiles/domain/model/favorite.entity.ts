/*
  Favorite is the rich domain entity that the view consumes.

  It is NOT assembled directly from a single API response.
  Instead, FavoritesStore joins two separate API calls:

    GET /favorites  → FavoriteRaw[]   (who saved what, distance, date)
    GET /parkings   → ParkingForFavorites[] (name, address, spots, price)

  For each FavoriteRaw, the store finds the matching ParkingForFavorites
  by parkingId and combines both into a single Favorite object.

  Think of it as a SQL join:
    SELECT f.*, p.name, p.address, p.availableSpaces, p.rating, p.pricePerHour
    FROM favorites f
    JOIN parkings p ON f.parkingId = p.id
    WHERE f.clientId = 'cli-001'

  This entity is the final result of that join. It has everything the
  view needs in one place so the template never has to look up related data.

  Unlike Subscription or ClientPlan, Favorite does not implement BaseEntity
  because it is never sent to or received from the API directly — it exists
  only inside the Angular application.
*/
export class Favorite {
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly parkingId: string,
    /*
      The fields below come from ParkingForFavorites (the parking table).
      They are injected by the store during the join — they do not exist
      in the /favorites API response.
    */
    public readonly name: string,
    public readonly address: string,
    public readonly availableSpots: number,
    public readonly rating: number,
    public readonly pricePerHour: number,
    /*
      The fields below come from FavoriteRaw (the favorites table).
    */
    public readonly distanceMi: number,
    public readonly lastVisited: string, // ISO 8601 date string
  ) {}
}
