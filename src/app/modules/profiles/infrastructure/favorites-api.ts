/*
  FavoritesApi is the single entry point for all HTTP operations
  in the favorites feature.

  It is intentionally separate from ProfilesApi (which handles admin
  and settings data) because favorites is a distinct concern with its
  own endpoints and entity types.

  The store (FavoritesStore) is the only class that talks to FavoritesApi.
  It never touches the endpoints directly.

  Methods exposed:
    getFavorites()    → GET /favorites   → FavoriteRaw[]
    getParkings()     → GET /parkings    → ParkingForFavorites[]
    removeFavorite()  → DELETE /favorites/:id

  FavoritesStore calls getFavorites() and getParkings() simultaneously
  using forkJoin and joins them by parkingId to build the Favorite entity.
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FavoriteRaw } from '../domain/model/favorite-raw.entity';
import { ParkingForFavorites } from '../domain/model/parking-for-favorites.entity';
import { FavoritesApiEndpoint } from './favorites-api-endpoint';
import { ParkingsApiEndpoint } from './parkings-api-endpoint';

@Injectable({ providedIn: 'root' })
export class FavoritesApi {
  private readonly favoritesEndpoint: FavoritesApiEndpoint;
  private readonly parkingsEndpoint: ParkingsApiEndpoint;

  constructor(http: HttpClient) {
    this.favoritesEndpoint = new FavoritesApiEndpoint(http);
    this.parkingsEndpoint  = new ParkingsApiEndpoint(http);
  }

  /*
    Returns the full favorites list from the API.
    The store filters by clientId after loading,
    following the same pattern used in PaymentStore for subscriptions.
  */
  getFavorites(): Observable<FavoriteRaw[]> {
    return this.favoritesEndpoint.getAll();
  }

  /*
    Returns all parkings so the store can join them with favorites by parkingId.
    This is a read-only call — no write operations on parkings from the client side.
  */
  getParkings(): Observable<ParkingForFavorites[]> {
    return this.parkingsEndpoint.getAll();
  }

  /*
    Sends DELETE /favorites/:id to remove the favorite from the database.
    The store removes it from the local signal immediately after success.
  */
  removeFavorite(id: string): Observable<void> {
    return this.favoritesEndpoint.delete(id);
  }

  addFavorite(raw: FavoriteRaw): Observable<FavoriteRaw> {
    return this.favoritesEndpoint.create(raw);
  }
}
