/*
  This file contains the internal routes of the profiles bounded context.

  In app.routes.ts, the parent route is:
  /profiles

  Therefore, every route in this file starts after:
  /profiles
*/

/*
  Import Angular Router configuration.

  Routes is the type that defines the routing structure
  of one bounded context.
*/
import { Routes } from '@angular/router';

/*
  This function loads the FavoritesComponent asynchronously.

  import('./views/favorites/favorites.component') loads the file
  only when Angular needs this route.

  The variable m represents the module that was imported.

  m.FavoritesComponent means:
  from the imported module, get the exported FavoritesComponent.

  This is lazy loading, which means the component code is downloaded
  only when the user navigates to its route.
*/
const favorites = () =>
  import('./views/favorites/favorites.component').then((m) => m.FavoritesComponent);

/*
  Define all profiles bounded context routes.

  These are child routes of the 'profiles' path from app.routes.ts.

  This means:
  app.routes.ts gives the parent path: /profiles
  this file gives the child path: /favorites

  Final route:
  /profiles/favorites
*/
export const PROFILES_ROUTES: Routes = [
  /*
    Default route for the profiles bounded context.

    When the user navigates to:
    /profiles

    Angular redirects them to:
    /profiles/favorites

    pathMatch: 'full' ensures this redirect only happens
    when the path is exactly /profiles.
  */
  { path: '', redirectTo: 'favorites', pathMatch: 'full' },

  /*
    Favorites view route.

    When the user navigates to:
    /profiles/favorites

    Angular loads:
    FavoritesComponent

    loadComponent uses the favorites function above
    to lazy load the component.
  */
  { path: 'favorites', loadComponent: favorites },
];
