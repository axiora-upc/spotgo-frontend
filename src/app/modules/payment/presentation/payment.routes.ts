/*
  Routes for payment-related pages exposed at the application root.
*/

/* Import Angular Router configuration. */
import { Routes } from '@angular/router';
import { roleGuard } from '../../iam/presentation/guards/role.guard';

/*
  This function loads the SubscriptionsComponent asynchronously.

  import('./views/suscriptions/subscriptions.component') loads the file
  only when Angular needs this route.

  The variable m represents the module that was imported.

  m.SubscriptionsComponent means:
  from the imported module, get the exported SubscriptionsComponent.

  This is lazy loading, which means the component code is downloaded
  only when the user navigates to its route.
*/
const subscriptions = () =>
  import('./views/subscriptions/subscriptions.component').then((m) => m.SubscriptionsComponent);

/*
  This function loads the ReceiptsComponent asynchronously.

  import('./views/receipts/receipts.component') loads the file
  only when Angular needs this route.

  The variable m represents the module that was imported.

  m.ReceiptsComponent means:
  from the imported module, get the exported ReceiptsComponent.

  This is lazy loading, which means the component code is downloaded
  only when the user navigates to its route.
*/
const receipts = () =>
  import('./views/receipts/receipts.component').then((m) => m.ReceiptsComponent);

/* Payment routes mounted at the root level: `/subscription`, `/receipts`. */
export const PAYMENT_ROUTES: Routes = [
  { path: 'subscription', loadComponent: subscriptions, canActivate: [roleGuard], data: { roles: ['client'] } },
  { path: 'receipts', loadComponent: receipts, canActivate: [roleGuard], data: { roles: ['client'] } },
];
