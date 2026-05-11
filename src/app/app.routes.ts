/*
  App routes is the principal map of all the aplication routes.
*/

/*
  Import Angular Router configuration.
  Routes is the type that defines the routing structure of the application.
*/
import { Routes } from '@angular/router';

/*
  Define all application routes.

  When a user navigates to a path, Angular Router loads the corresponding module's routes.
  Each module has its own routes file (monitoring.routes.ts, parking.routes.ts, etc.)

  loadChildren lazy loads the routes from each module asynchronously.
  This means the module code is only downloaded when the user navigates to it.

  pathMatch: 'full' ensures the empty path only matches when the URL is exactly empty.
  redirectTo sends users to the default module when they land on the home path.
*/
export const routes: Routes = [
  /*
    Monitoring module route.

    This bounded context contains views related to monitoring and dashboards.
    - Dashboard: main overview and statistics

    loadChildren lazy loads monitoring.routes.ts only when the user navigates here.
  */
  {
    path: 'monitoring',
    loadChildren: () =>
      import('./modules/monitoring/presentation/monitoring.routes').then(
        (m) => m.MONITORING_ROUTES
      ),
  },

  /*
    Parking module route.

    This bounded context contains views related to parking management.
    - Reservations: manage parking reservations
    - History: view past parking sessions

    loadChildren lazy loads parking.routes.ts when the user navigates here.
  */
  {
    path: 'parking',
    loadChildren: () =>
      import('./modules/parking/presentation/parking.routes').then(
        (m) => m.PARKING_ROUTES
      ),
  },

  /*
    Payment module route.

    This bounded context contains views related to payments and billing.
    - Subscriptions: manage subscription plans
    - Receipts: view payment receipts and transactions

    loadChildren lazy loads payment.routes.ts when the user navigates here.
  */
  {
    path: 'payment',
    loadChildren: () =>
      import('./modules/payment/presentation/payment.routes').then(
        (m) => m.PAYMENT_ROUTES
      ),
  },

  /*
    Profiles module route.

    This bounded context contains views related to user profiles and preferences.
    - Favorites: manage favorite parking locations

    loadChildren lazy loads profiles.routes.ts when the user navigates here.
  */
  {
    path: 'profiles',
    loadChildren: () =>
      import('./modules/profiles/presentation/profiles.routes').then(
        (m) => m.PROFILES_ROUTES
      ),
  },

  /*
    Default route.

    When the user navigates to "/" or the app loads, they are redirected to "/monitoring".
    This loads the monitoring dashboard as the entry point of the application.
  */
  { path: '', redirectTo: '/monitoring', pathMatch: 'full' },
];
