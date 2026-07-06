/*
  App routes is the principal map of all the aplication routes.
*/

/*
  Import Angular Router configuration.
  Routes is the type that defines the routing structure of the application.
*/
import { Routes } from '@angular/router';
import { Layout } from './shared/presentation/components/layout/layout';
import { authGuard } from './modules/iam/presentation/guards/auth.guard';

/*
  Define all application routes.

  Public auth pages live at the root level (`/sign-in`, `/sign-up`,
  `/forgot-password`). Protected pages also live at the root level inside
  Layout, grouped by feature-specific lazy route files.
*/
export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./modules/iam/presentation/iam.routes').then((m) => m.IAM_ROUTES),
  },

  /*
    Protected application shell.

    All authenticated pages render inside Layout (toolbar + sidebar +
    content). The empty child path ('') still resolves through
    RoleRedirect so `/` lands on the default route for the authenticated
    user's role.
  */
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./modules/iam/presentation/views/role-redirect/role-redirect').then(
            (m) => m.RoleRedirect
          ),
      },

      {
        path: '',
        loadChildren: () =>
          import('./modules/monitoring/presentation/monitoring.routes').then(
            (m) => m.MONITORING_ROUTES
          ),
      },
      {
        path: '',
        loadChildren: () =>
          import('./modules/parking/presentation/parking.routes').then(
            (m) => m.PARKING_ROUTES
          ),
      },
      {
        path: '',
        loadChildren: () =>
          import('./modules/payment/presentation/payment.routes').then(
            (m) => m.PAYMENT_ROUTES
          ),
      },
      {
        path: '',
        loadChildren: () =>
          import('./modules/profiles/presentation/profiles.routes').then(
            (m) => m.PROFILES_ROUTES
          ),
      },
    ],
  },

  /*
    Fallback route.

    Anything unmatched falls back to the root path, which resolves through
    authGuard + RoleRedirect above.
  */
  { path: '**', redirectTo: '' },
];
