import { inject } from '@angular/core';
import { CanActivateFn, Router, type UrlTree } from '@angular/router';
import { AuthStore } from '../../application/auth.store';
import { Role } from '../../domain/model/user.entity';
import { defaultRouteForRole } from '../../application/default-route.util';

/*
  roleGuard restricts route access based on the authenticated user's role.

  Usage in route config:
    canActivate: [roleGuard],
    data: { roles: ['admin'] }

  If the user's role is not in the allowed list, they are redirected to
  their role's default landing page (admin -> /realtime-map/overview,
  client -> /dashboard).
*/
export const roleGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const user = authStore.currentUser();
  if (!user) return router.createUrlTree(['/sign-in']);

  const allowedRoles: Role[] | undefined = route.data?.['roles'];
  if (!allowedRoles || allowedRoles.length === 0) return true;

  if (allowedRoles.includes(user.role)) return true;

  return router.createUrlTree([defaultRouteForRole(user.role)]);
};
