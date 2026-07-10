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
  ViewModeService is a shared service that reflects the authenticated
  user's role in the sidebar (`user` or `admin`).
*/
import { ViewModeService } from '../../services/view-mode.service';

/*
  Shape of one sidebar navigation option.

  An explicit interface is required so both userOptions and adminOptions
  share the same element type. Without it, TypeScript would infer two
  different array types and the template would not accept option.exact
  on user options (the union would only expose properties common to
  both arrays).

  exact controls how routerLinkActive matches the current URL:
  - exact: true  → the link is active only when the URL matches exactly.
  - exact: false → the link stays active for any child route.

  Most options use exact: true. Real-time Map uses exact: false because
  its URL becomes /realtime-map/overview after the default child redirect,
  so we still want the parent item highlighted.
*/
interface SidebarOption {
  link: string;
  label: string;
  icon: string;
  exact?: boolean;
}

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
      Each link points directly to the flattened application route.

    - label: the translation key shown in the UI.
      These keys come from the i18n translation files (en.json, es.json).

    - icon: the Angular Material icon name.
      These are the Material Design icon names.
  */
  private userOptions = signal<SidebarOption[]>([
    /*
      Dashboard: part of the monitoring module.
      Shows application overview and statistics.
    */
    { link: '/dashboard', label: 'sidebar.dashboard', icon: 'grid_view' },

    /*
      Reservations: part of the parking module.
      Allows users to view and manage parking reservations.
    */
    { link: '/reservations', label: 'sidebar.reservations', icon: 'event_available' },

    /*
      Subscriptions: part of the payment module.
      Manages user subscription plans and memberships.
    */
    { link: '/subscription', label: 'sidebar.subscription', icon: 'workspace_premium' },

    /*
      Receipts: part of the payment module.
      Shows payment receipts and transaction history.
    */
    { link: '/receipts', label: 'sidebar.receipts', icon: 'receipt_long' },

    /*
      Favorites: part of the profiles module.
      Shows saved favorite parking locations.
    */
    { link: '/favorites', label: 'sidebar.favorites', icon: 'star_border' },

    /*
      History: part of the parking module.
      Displays the user's past parking sessions and activity log.
    */
    { link: '/history', label: 'sidebar.history', icon: 'history' }
  ]);

  /*
    adminOptions contains the sidebar navigation items shown
    when the app is in 'admin' mode.

    These routes point directly to the admin pages exposed at the root.
  */
  private adminOptions = signal<SidebarOption[]>([
    /*
      Real-time Map: part of the monitoring module.
      Shows a live map with active parking spots and reservations.

      exact: false keeps the link highlighted while the user navigates
      between its child tabs (overview, reports, employees), since the
      URL becomes /realtime-map/overview after the default
      redirect.
    */
    { link: '/realtime-map', label: 'sidebar.realtime-map', icon: 'map', exact: false },

    /*
      Analytics: part of the monitoring module.
      Shows charts and statistics for admin analysis.
    */
    { link: '/analytics', label: 'sidebar.analytics', icon: 'bar_chart' },

    /*
      Settings: part of the profiles module.
      Allows the admin to configure application settings.
    */
    { link: '/settings', label: 'sidebar.settings', icon: 'settings' }
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
