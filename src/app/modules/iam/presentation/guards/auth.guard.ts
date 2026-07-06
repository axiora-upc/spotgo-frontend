import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../application/auth.store';

/*
  authGuard protects every route nested under the app Layout
  (monitoring, parking, payment, profiles — see app.routes.ts).

  If there is no authenticated user, it redirects to the login page
  instead of rendering the toolbar/sidebar/protected content.
*/
export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) return true;

  return router.createUrlTree(['/sign-in']);
};
