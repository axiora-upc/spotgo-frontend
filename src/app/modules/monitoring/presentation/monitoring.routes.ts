/*
  Routes for monitoring-related pages exposed at the application root.
*/

/*
  Import Angular Router configuration.
*/
import { Routes } from '@angular/router';
import { roleGuard } from '../../iam/presentation/guards/role.guard';

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
  This function loads the AnalyticsComponent asynchronously.

  This is the admin-only view that shows charts and statistics.
*/
const analytics = () =>
  import('./views/analytics/analytics').then((m) => m.Analytics);

/*
  Monitoring routes mounted at the root level:
  `/dashboard`, `/realtime-map/...`, `/analytics`.
*/
export const MONITORING_ROUTES: Routes = [
  { path: 'dashboard', loadComponent: dashboard, canActivate: [roleGuard], data: { roles: ['client'] } },

  /*
    Real-time Map route. Admin-only view.

    When the user navigates to:
    /realtime-map

    Angular loads RealtimeMapComponent, which acts as a shell with
    its own router-outlet and three child tabs (Overview, Reports,
    Employees).

    The empty child route ('') redirects to /overview so the user
    always lands on the Overview tab by default.
  */
  {
    path: 'realtime-map',
    loadComponent: realtimeMap,
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', loadComponent: realtimeMapOverview },
      { path: 'reports', loadComponent: realtimeMapReports },
      { path: 'employees', loadComponent: realtimeMapEmployees },
    ],
  },
  {
    path: 'analytics',
    loadComponent: analytics,
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
];
