/*
  Component is used to declare that this class is an Angular component.
  signal is used to create reactive state variables.
*/
import { Component, signal } from '@angular/core';

/*
  RouterLink is used to navigate to another route.
  RouterLinkActive is used to apply a class when the route is active.
*/
import { RouterLink, RouterLinkActive } from '@angular/router';

/*
  MatIcon is used to show Angular Material icons.

  Example:
  <mat-icon>dashboard</mat-icon>
*/
import { MatIcon } from '@angular/material/icon';

/*
  For translations, we use the TranslatePipe from @ngx-translate/core.
*/
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  /*
    selector is the HTML tag used to render this component
    in another component's template.

    Example:
    <app-sidebar-content></app-sidebar-content>
  */
  selector: 'app-sidebar-content',

  /*
    imports defines what can be used inside sidebar-content.html.

    In this case, sidebar-content.html can use:
    - routerLink
    - routerLinkActive
    - <mat-icon>
    - translate pipe
  */
  imports: [
    RouterLink,
    RouterLinkActive,
    MatIcon,
    TranslatePipe
  ],

  /*
    templateUrl defines which HTML file contains the structure
    of this component.
  */
  templateUrl: './sidebar-content.html',

  /*
    styleUrl defines which CSS file contains the styles
    for this component.
  */
  styleUrl: './sidebar-content.css',
})
export class SidebarContent {

  /*
    options contains the sidebar navigation items.

    Each option has:
    - link: the route where the user will navigate.
      These routes correspond to the modules defined in app.routes.ts.
      Each path follows the pattern: /{module-name}/{view-name}

    - label: the translation key shown in the UI.
      These keys come from the i18n translation files (en.json, es.json).

    - icon: the Angular Material icon name.
      These are the Material Design icon names.

    When the user clicks a link, routerLink navigates to that path.
    routerLinkActive adds the "selected" CSS class when the current route matches.
  */
  options = signal([
    /*
      Dashboard: part of the monitoring module.
      Shows application overview and statistics.
    */
    { link: '/monitoring/dashboard', label: 'sidebar.dashboard', icon: 'grid_view' },

    /*
      Reservations: part of the parking module.
      Allows users to view and manage parking reservations.
    */
    { link: '/parking/reservations', label: 'sidebar.reservations', icon: 'event_available' },

    /*
      Subscriptions: part of the payment module.
      Manages user subscription plans and memberships.
    */
    { link: '/payment/subscriptions', label: 'sidebar.subscription', icon: 'workspace_premium' },

    /*
      Receipts: part of the payment module.
      Shows payment receipts and transaction history.
    */
    { link: '/payment/receipts', label: 'sidebar.receipts', icon: 'receipt_long' },

    /*
      Favorites: part of the profiles module.
      Shows saved favorite parking locations.
    */
    { link: '/profiles/favorites', label: 'sidebar.favorites', icon: 'star_border' },

    /*
      History: part of the parking module.
      Displays the user's past parking sessions and activity log.
    */
    { link: '/parking/history', label: 'sidebar.history', icon: 'history' }
  ]);

}
