import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../application/auth.store';
import { defaultRouteForRole } from '../../application/default-route.util';

/*
  guestGuard protects the login/register routes themselves.

  If a user is already authenticated (e.g. they still have a session from
  a previous visit and type the login URL directly, or click back after
  signing in), send them straight to their role's default page instead of
  showing the login/register form again.
*/
export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const user = authStore.currentUser();
  if (!user) return true;

  return router.createUrlTree([defaultRouteForRole(user.role)]);
};
