/*
  This file contains the internal routes of the payment bounded context.

  In app.routes.ts, the parent route is:
  /payment

  Therefore, every route in this file starts after:
  /payment
*/

/*
  Import Angular Router configuration.

  Routes is the type that defines the routing structure
  of one bounded context.
*/
import { Routes } from '@angular/router';

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

/*
  Define all payment bounded context routes.

  These are child routes of the 'payment' path from app.routes.ts.

  This means:
  app.routes.ts gives the parent path: /payment
  this file gives the child paths: /subscriptions and /receipts

  Final routes:
  /payment/subscriptions
  /payment/receipts
*/
export const PAYMENT_ROUTES: Routes = [
  /*
    Default route for the payment bounded context.

    When the user navigates to:
    /payment

    Angular redirects them to:
    /payment/subscriptions

    pathMatch: 'full' ensures this redirect only happens
    when the path is exactly /payment.
  */
  { path: '', redirectTo: 'subscriptions', pathMatch: 'full' },

  /*
    Subscriptions view route.

    When the user navigates to:
    /payment/subscriptions

    Angular loads:
    SubscriptionsComponent

    loadComponent uses the subscriptions function above
    to lazy load the component.
  */
  { path: 'subscriptions', loadComponent: subscriptions },

  /*
    Receipts view route.

    When the user navigates to:
    /payment/receipts

    Angular loads:
    ReceiptsComponent

    loadComponent uses the receipts function above
    to lazy load the component.
  */
  { path: 'receipts', loadComponent: receipts },
];
