/*
  Component is used to declare that this class is an Angular component.
  signal is used to create reactive state variables.
  computed is used to derive a value from other signals automatically.
  inject is used to get an injectable service inside the class.
*/
import { Component, computed, inject, signal } from '@angular/core';

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

/*
  ViewModeService is a shared service that holds the current view mode.

  It has a signal called mode that can be either 'user' or 'admin'.

  When the admin clicks the account button in the toolbar and selects
  "Admin View", the mode changes to 'admin'.

  When the user selects "User View", the mode changes back to 'user'.
*/
import { ViewModeService } from '../../services/view-mode.service';

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
    inject(ViewModeService) gives this component access to the
    shared service that tracks whether the app is in 'user' or 'admin' mode.

    When the mode changes in the toolbar, this component reacts automatically
    because options is a computed signal that depends on viewMode.mode().
  */
  private viewMode = inject(ViewModeService);

  /*
    userOptions contains the sidebar navigation items shown
    when the app is in 'user' mode.

    Each option has:
    - link: the route where the user will navigate.
      These routes correspond to the modules defined in app.routes.ts.
      Each path follows the pattern: /{module-name}/{view-name}

    - label: the translation key shown in the UI.
      These keys come from the i18n translation files (en.json, es.json).

    - icon: the Angular Material icon name.
      These are the Material Design icon names.
  */
  private userOptions = signal([
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

  /*
    adminOptions contains the sidebar navigation items shown
    when the app is in 'admin' mode.

    These routes belong to the monitoring and profiles modules,
    following the same /{module-name}/{view-name} pattern.
  */
  private adminOptions = signal([
    /*
      Real-time Map: part of the monitoring module.
      Shows a live map with active parking spots and reservations.
    */
    { link: '/monitoring/realtime-map', label: 'sidebar.realtime-map', icon: 'map' },

    /*
      Analytics: part of the monitoring module.
      Shows charts and statistics for admin analysis.
    */
    { link: '/monitoring/analytics', label: 'sidebar.analytics', icon: 'bar_chart' },

    /*
      Settings: part of the profiles module.
      Allows the admin to configure application settings.
    */
    { link: '/profiles/settings', label: 'sidebar.settings', icon: 'settings' }
  ]);

  /*
    options is a computed signal.

    A computed signal recalculates its value automatically
    whenever the signals it reads change.

    In this case, options reads viewMode.mode().

    When mode() is 'admin', options returns adminOptions.
    When mode() is 'user', options returns userOptions.

    This means the sidebar updates instantly when the user
    switches between views in the toolbar account menu.
  */
  options = computed(() =>
    this.viewMode.mode() === 'admin' ? this.adminOptions() : this.userOptions()
  );

}
