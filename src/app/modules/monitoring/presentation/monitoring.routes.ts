/*
  Every bounded context has its own routes file.

  This file works as an internal map for the views
  that belong to the monitoring bounded context.
*/

/*
  Import Angular Router configuration.

  Routes is the type that defines the routing structure
  of one bounded context.
*/
import { Routes } from '@angular/router';

/*
  This function loads the DashboardComponent asynchronously.

  import('./views/dashboard/dashboard.component') loads the file
  only when Angular needs this route.

  The variable m represents the module that was imported.

  m.DashboardComponent means:
  from the imported module, get the exported DashboardComponent.

  This is lazy loading, which means the component code is downloaded
  only when the user navigates to its route.
*/
const dashboard = () =>
  import('./views/dashboard/dashboard.component').then((m) => m.DashboardComponent);

/*
  This function loads the RealtimeMapComponent asynchronously.

  This is the admin-only view that shows a live map
  with active parking spots and reservations.
*/
const realtimeMap = () =>
  import('./views/realtime-map/realtime-map.component').then((m) => m.RealtimeMapComponent);

/*
  This function loads the AnalyticsComponent asynchronously.

  This is the admin-only view that shows charts and statistics.
*/
const analytics = () =>
  import('./views/analytics/analytics.component').then((m) => m.AnalyticsComponent);

/*
  Define all monitoring bounded context routes.

  These are child routes of the 'monitoring' path from app.routes.ts.

  This means:
  app.routes.ts gives the parent path: /monitoring
  this file gives the child paths: /dashboard, /realtime-map, /analytics

  Final routes:
  /monitoring/dashboard
  /monitoring/realtime-map
  /monitoring/analytics
*/
export const MONITORING_ROUTES: Routes = [
  /*
    Default route for the monitoring bounded context.

    When the user navigates to:
    /monitoring

    Angular redirects them to:
    /monitoring/dashboard

    pathMatch: 'full' ensures this redirect only happens
    when the path is exactly /monitoring.
  */
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  /*
    Dashboard route inside the monitoring bounded context.

    When the user navigates to:
    /monitoring/dashboard

    Angular loads:
    DashboardComponent

    loadComponent uses the dashboard function above
    to lazy load the component.
  */
  { path: 'dashboard', loadComponent: dashboard },

  /*
    Real-time Map route. Admin-only view.

    When the user navigates to:
    /monitoring/realtime-map

    Angular loads:
    RealtimeMapComponent
  */
  { path: 'realtime-map', loadComponent: realtimeMap },

  /*
    Analytics route. Admin-only view.

    When the user navigates to:
    /monitoring/analytics

    Angular loads:
    AnalyticsComponent
  */
  { path: 'analytics', loadComponent: analytics },
];
