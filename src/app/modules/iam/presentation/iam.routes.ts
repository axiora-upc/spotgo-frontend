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
const terms = () => import('./views/terms/terms').then((m) => m.Terms);
const privacy = () => import('./views/privacy/privacy').then((m) => m.Privacy);

export const IAM_ROUTES: Routes = [
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
  { path: 'sign-in', loadComponent: login, canActivate: [guestGuard] },
  { path: 'sign-up', loadComponent: register, canActivate: [guestGuard] },
  { path: 'forgot-password', loadComponent: forgotPassword, canActivate: [guestGuard] },
  { path: 'terms', loadComponent: terms },
  { path: 'privacy-policy', loadComponent: privacy },

  { path: 'iam', redirectTo: 'sign-in', pathMatch: 'full' },
];
