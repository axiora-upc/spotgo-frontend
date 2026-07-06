/*
  Routes for reservation/history pages exposed at the application root.
*/

/* Import Angular Router configuration. */
import { Routes } from '@angular/router';

/*
  This function loads the ReservationsComponent.

  import('./views/reservations/reservations.component') loads the file
  only when Angular needs this route.

  The variable m represents the module that was imported.

  m.ReservationsComponent means:
  from the imported module, get the exported ReservationsComponent.

  This is lazy loading, which means the component code is downloaded
  only when the user navigates to its route.
*/
const reservations = () =>
  import('./views/reservations/reservations.component').then((m) => m.ReservationsComponent);

/*
  This function loads the HistoryComponent asynchronously.

  import('./views/history/history.component') loads the file
  only when Angular needs this route.

  The variable m represents the module that was imported.

  m.HistoryComponent means:
  from the imported module, get the exported HistoryComponent.

  This is lazy loading, which means the component code is downloaded
  only when the user navigates to its route.
*/
const history = () => import('./views/history/history.component').then((m) => m.HistoryComponent);

/* Parking routes mounted at the root level: `/reservations`, `/history`. */
export const PARKING_ROUTES: Routes = [
  { path: 'reservations', loadComponent: reservations },

  { path: 'history', loadComponent: history },
];
