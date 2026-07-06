/*
  Routes for profile-related pages exposed at the application root.
*/

/* Import Angular Router configuration. */
import { Routes } from '@angular/router';
import { roleGuard } from '../../iam/presentation/guards/role.guard';

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
  This function loads the SettingsComponent asynchronously.

  This is the admin-only view that allows configuring application settings.
*/
const settings = () =>
  import('./views/settings/settings.component').then((m) => m.SettingsComponent);

/* Profiles routes mounted at the root level: `/favorites`, `/settings`. */
export const PROFILES_ROUTES: Routes = [
  { path: 'favorites', loadComponent: favorites, canActivate: [roleGuard], data: { roles: ['client'] } },
  { path: 'settings', loadComponent: settings, canActivate: [roleGuard], data: { roles: ['admin'] } },
];
