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
  import('./views/dashboard/dashboard').then((m) => m.Dashboard);

/*
  This function loads the RealtimeMapComponent asynchronously.

  This is the admin-only view that shows a live map
  with active parking spots and reservations.

  The Realtime Map is itself a shell that hosts three child routes
  (overview, reports and employees), so it owns its own router-outlet.
*/
const realtimeMap = () =>
  import('./views/realtime-map/realtime-map').then((m) => m.RealtimeMap);

/*
  Lazy loaders for the realtime-map child views.

  Each function returns a promise that resolves to a single component,
  so Angular can lazy load each tab independently.

  These files follow the Angular 17+ convention where the component
  files drop the .component suffix (overview.ts, overview.html, etc.).
*/
const realtimeMapOverview = () =>
  import('./views/realtime-map/overview/overview').then((m) => m.Overview);

const realtimeMapReports = () =>
  import('./views/realtime-map/reports/reports').then((m) => m.Reports);

const realtimeMapEmployees = () =>
  import('./views/realtime-map/employees/employees').then((m) => m.Employees);

/*
  Define all monitoring bounded context routes.

  These are child routes of the 'monitoring' path from app.routes.ts.

  This means:
  app.routes.ts gives the parent path: /monitoring
  this file gives the child paths: /dashboard, /realtime-map, /analytics

  Final routes:
  /monitoring/dashboard
  /monitoring/realtime-map
  /monitoring/realtime-map/overview
  /monitoring/realtime-map/reports
  /monitoring/realtime-map/employees
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

    Angular loads RealtimeMapComponent, which acts as a shell with
    its own router-outlet and three child tabs (Overview, Reports,
    Employees).

    The empty child route ('') redirects to /overview so the user
    always lands on the Overview tab by default.
  */
  {
    path: 'realtime-map',
    loadComponent: realtimeMap,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', loadComponent: realtimeMapOverview },
      { path: 'reports', loadComponent: realtimeMapReports },
      { path: 'employees', loadComponent: realtimeMapEmployees },
    ],
  },
];
