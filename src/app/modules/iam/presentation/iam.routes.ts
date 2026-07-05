/*
  This file contains the internal routes of the IAM bounded context.

  These routes are NOT nested under the app Layout (see app.routes.ts),
  since login/register must render full-screen, without the toolbar or
  the sidebar.
*/
import { Routes } from '@angular/router';
import { guestGuard } from './guards/guest.guard';

const login = () => import('./views/login/login').then((m) => m.Login);
const register = () => import('./views/register/register').then((m) => m.Register);
const forgotPassword = () =>
  import('./views/forgot-password/forgot-password').then((m) => m.ForgotPassword);

export const IAM_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  /*
    guestGuard keeps an already-authenticated user from landing back on
    the login/register/forgot-password forms (e.g. by typing the URL or
    clicking Back).
  */
  { path: 'login', loadComponent: login, canActivate: [guestGuard] },
  { path: 'register', loadComponent: register, canActivate: [guestGuard] },
  { path: 'forgot-password', loadComponent: forgotPassword, canActivate: [guestGuard] },
];
