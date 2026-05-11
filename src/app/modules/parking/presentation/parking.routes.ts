/*
  This file contains the internal routes of the parking bounded context.

  In app.routes.ts, the parent route is:
  /parking

  Therefore, every route in this file starts after:
  /parking
*/

/*
  Import Angular Router configuration.

  Routes is the type that defines the routing structure
  of one bounded context.
*/
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

/*
  Define all parking bounded context routes.

  These are child routes of the 'parking' path from app.routes.ts.

  This means:
  app.routes.ts gives the parent path: /parking
  this file gives the child paths: /reservations and /history

  Final routes:
  /parking/reservations
  /parking/history
*/
export const PARKING_ROUTES: Routes = [
  /*
    Default route for the parking bounded context.

    When the user navigates to:
    /parking

    Angular redirects them to:
    /parking/reservations

    pathMatch: 'full' ensures this redirect only happens
    when the path is exactly /parking.
  */
  { path: '', redirectTo: 'reservations', pathMatch: 'full' },

  /*
    Reservations view route.

    When the user navigates to:
    /parking/reservations

    Angular loads:
    ReservationsComponent

    loadComponent uses the reservations function above
    to lazy load the component.
  */
  { path: 'reservations', loadComponent: reservations },

  /*
    History view route.

    When the user navigates to:
    /parking/history

    Angular loads:
    HistoryComponent

    loadComponent uses the history function above
    to lazy load the component.
  */
  { path: 'history', loadComponent: history },
];
