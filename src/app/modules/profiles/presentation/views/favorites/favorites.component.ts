/*
  FavoritesComponent displays the list of parking spots the logged-in
  client has saved as favorites.

  The store is the only dependency this component needs.
  It provides all signals (favorites, loading, error) and all actions
  (loadFavoritesByClientId, removeFavorite).

  The view never talks to FavoritesApi or FavoritesStore internals directly.
*/
import { Component, OnInit, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FavoritesStore } from '../../../application/favorites.store';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css',
})
export class FavoritesComponent implements OnInit {
  protected readonly store = inject(FavoritesStore);

  ngOnInit(): void {
    /*
      'cli-001' is hardcoded for now — will be replaced with the
      logged-in client id once authentication is implemented.
    */
    this.store.loadFavoritesByClientId('cli-001');
  }

  protected onRemove(id: string): void {
    this.store.removeFavorite(id);
  }

  /*
    Returns the i18n key for the relative time label.
    The key varies based on how many days ago the parking was visited:
      0 days  → 'favorites.time.today'
      1 day   → 'favorites.time.yesterday'
      2-6     → 'favorites.time.days-ago'
      1 week  → 'favorites.time.week-ago'   (singular)
      2-4 wks → 'favorites.time.weeks-ago'  (plural)
      1 month → 'favorites.time.month-ago'  (singular)
      2+ mo   → 'favorites.time.months-ago' (plural)

    This method pairs with timeParams() — both are called in the template
    as: {{ timeKey(fav.lastVisited) | translate: timeParams(fav.lastVisited) }}
    The translate pipe resolves the key and injects the count parameter.
  */
  protected timeKey(lastVisited: string): string {
    const days = this.daysAgo(lastVisited);
    if (days === 0) return 'favorites.time.today';
    if (days === 1) return 'favorites.time.yesterday';
    if (days < 7)  return 'favorites.time.days-ago';
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return weeks === 1 ? 'favorites.time.week-ago' : 'favorites.time.weeks-ago';
    const months = Math.floor(days / 30);
    return months === 1 ? 'favorites.time.month-ago' : 'favorites.time.months-ago';
  }

  /*
    Returns the interpolation parameters object for the translate pipe.
    Only the relevant count is included based on the time range,
    matching the placeholders in the i18n files:
      'favorites.time.days-ago'  → { days: N }
      'favorites.time.weeks-ago' → { weeks: N }
      'favorites.time.months-ago'→ { months: N }
      today / yesterday / week-ago / month-ago → no params needed (empty object)
  */
  protected timeParams(lastVisited: string): object {
    const days = this.daysAgo(lastVisited);
    if (days < 7)  return { days };
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return { weeks };
    return { months: Math.floor(days / 30) };
  }

  /*
    Calculates how many full days have passed since the given ISO date.
    86_400_000 = number of milliseconds in one day (24h × 60m × 60s × 1000ms).
  */
  private daysAgo(isoDate: string): number {
    return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
  }
}
