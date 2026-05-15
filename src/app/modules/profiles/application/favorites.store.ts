/*
  FavoritesStore is the application layer of the favorites feature.

  It is the bridge between the view and the API:
    View  calls store methods (loadFavoritesByClientId, removeFavorite)
    Store calls FavoritesApi
    FavoritesApi delegates to FavoritesApiEndpoint / ParkingsApiEndpoint
    Endpoints execute the HTTP calls

  The view never talks to FavoritesApi directly.
  It only reads signals and calls store methods.

  The join:
    Unlike most stores that load a single collection, this store must
    load TWO collections (favorites + parkings) and join them before
    exposing the result. It uses RxJS forkJoin to fire both HTTP requests
    simultaneously and waits for both to complete before building the
    Favorite entities. This is more efficient than loading them in sequence.

    forkJoin({ a$, b$ }) emits { a, b } once BOTH observables complete —
    equivalent to Promise.all() in the async/await world.
*/
import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Favorite } from '../domain/model/favorite.entity';
import { FavoritesApi } from '../infrastructure/favorites-api';

@Injectable({ providedIn: 'root' })
export class FavoritesStore {
  /*
    Angular delivers FavoritesApi here automatically.
    The store is the only class that talks to FavoritesApi.
  */
  private readonly favoritesApi = inject(FavoritesApi);

  /*
    Signals are the in-memory state of the page.
    The view receives readonly versions below — it can read but not write.
  */
  private readonly favoritesSignal = signal<Favorite[]>([]);
  private readonly loadingSignal   = signal(false);
  private readonly errorSignal     = signal<string | null>(null);

  readonly favorites = this.favoritesSignal.asReadonly();
  readonly loading   = this.loadingSignal.asReadonly();
  readonly error     = this.errorSignal.asReadonly();

  /*
    Called by the view on init, passing the logged-in client id.

    What happens:
      1. loading is set to true so the view can show a loading state
      2. forkJoin fires GET /favorites and GET /parkings simultaneously
      3. When both respond, the store filters favorites by clientId
      4. For each favorite, it finds the matching parking by parkingId
      5. It combines both into a Favorite entity (the join)
      6. The result is saved in the signal; the view re-renders automatically
  */
  loadFavoritesByClientId(clientId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    forkJoin({
      favRaws:  this.favoritesApi.getFavorites(),
      parkings: this.favoritesApi.getParkings(),
    }).subscribe({
      next: ({ favRaws, parkings }) => {
        /*
          Build a Map for O(1) lookup instead of scanning the array
          on every iteration: parkingId → ParkingForFavorites.
        */
        const parkingMap = new Map(parkings.map(p => [p.id, p]));

        const favorites = favRaws
          .filter(f => f.clientId === clientId)
          .map(f => {
            const p = parkingMap.get(f.parkingId);
            /*
              If the parking is not found (data inconsistency), the entity
              is still created with safe fallback values so the view
              does not crash. In production, this case would be logged.
            */
            return new Favorite(
              f.id,
              f.clientId,
              f.parkingId,
              p?.name            ?? f.parkingId,
              p?.address         ?? '',
              p?.availableSpaces ?? 0,
              p?.rating          ?? 0,
              p?.pricePerHour    ?? 0,
              f.distanceMi,
              f.lastVisited,
            );
          });

        this.favoritesSignal.set(favorites);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to load favorites'));
        this.loadingSignal.set(false);
      },
    });
  }

  /*
    Called when the user clicks the delete button on a favorite card.

    What happens:
      1. Store calls favoritesApi.removeFavorite(id)
      2. API sends DELETE /favorites/:id
      3. On success, the store removes the item from the signal locally —
         no need to re-fetch the full list from the API.
      4. The view reacts automatically via the signal.

    callbacks let the view react to success or error (e.g. show a snackbar)
    without the store depending on any UI library.
  */
  removeFavorite(
    id: string,
    callbacks?: { onSuccess?: () => void; onError?: () => void }
  ): void {
    this.favoritesApi.removeFavorite(id).subscribe({
      next: () => {
        /*
          signal.update() receives the current array and returns a new one.
          This is the Angular Signals way of doing an immutable state update.
        */
        this.favoritesSignal.update(favs => favs.filter(f => f.id !== id));
        callbacks?.onSuccess?.();
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to remove favorite'));
        callbacks?.onError?.();
      },
    });
  }

  private formatError(err: unknown, fallback: string): string {
    if (err instanceof Error) return err.message;
    return fallback;
  }
}
