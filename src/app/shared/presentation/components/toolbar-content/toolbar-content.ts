/*
  Component is used to declare that this class is an Angular component.
  inject is used to get an injectable service inside the class.
*/
import { Component, inject } from '@angular/core';

/*
  Router is used to navigate programmatically when the user
  switches between view modes.
*/
import { Router } from '@angular/router';

/*
  MatToolbar and MatToolbarRow are Angular Material components.

  They are used to create the top toolbar structure.
*/
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';

/*
  MatIconButton is used to create icon buttons inside the toolbar.
*/
import { MatIconButton } from '@angular/material/button';

/*
  MatIcon is used to show Angular Material icons.

  Example:
  <mat-icon>account_circle</mat-icon>
  <mat-icon>add_alert</mat-icon>
*/
import { MatIcon } from '@angular/material/icon';

/*
  MatMenu is the dropdown panel that appears when triggered.
  MatMenuItem is each option inside the menu.
  MatMenuTrigger is the directive that links a button to a MatMenu.
*/
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

/*
  LanguageSwitcher is the component used to change the application language.
*/
import { LanguageSwitcher } from '../language-switcher/language-switcher';

/*
  For translations, we use the TranslatePipe from @ngx-translate/core.
*/
import { TranslatePipe } from '@ngx-translate/core';

/*
  ViewModeService is a shared service that tracks whether the app is
  showing the 'user' view or the 'admin' view in the sidebar.

  ViewMode is the type that represents the two possible values: 'user' | 'admin'.
*/
import { ViewModeService, ViewMode } from '../../services/view-mode.service';

@Component({
  /*
    selector is the HTML tag used to render this component
    in another component's template.

    Example:
    <app-toolbar-content></app-toolbar-content>
  */
  selector: 'app-toolbar-content',

  /*
    imports defines what can be used inside toolbar-content.html.

    In this case, toolbar-content.html can use:
    - <mat-toolbar>
    - <mat-toolbar-row>
    - mat-button / mat-icon-button
    - <mat-icon>
    - <mat-menu>, mat-menu-item, matMenuTriggerFor
    - <app-language-switcher>
    - translate pipe
  */
  imports: [
    MatToolbar,
    MatToolbarRow,
    MatIconButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    LanguageSwitcher,
    TranslatePipe,
  ],
  /*
    templateUrl defines which HTML file contains the structure
    of this component.
  */
  templateUrl: './toolbar-content.html',

  /*
    styleUrl defines which CSS file contains the styles
    for this component.
  */
  styleUrl: './toolbar-content.css',
})
export class ToolbarContent {

  /*
    inject(ViewModeService) gives this component access to the
    shared service that controls the current view mode.

    When the user clicks the account button and selects a view,
    setMode() updates the signal in ViewModeService.

    The sidebar reacts to this change automatically.
  */
  private viewMode = inject(ViewModeService);

  /*
    Router allows navigating programmatically to a route.

    When the user switches view modes, the app navigates automatically
    to the default page for that mode instead of staying on the current page.
  */
  private router = inject(Router);

  /*
    Default routes for each view mode.

    - user  → /monitoring/dashboard  (standard user landing page)
    - admin → /monitoring/realtime-map (admin landing page)
  */
  private defaultRoutes: Record<ViewMode, string> = {
    user: '/monitoring/dashboard',
    admin: '/monitoring/realtime-map',
  };

  /*
    setMode is called when the user clicks one of the menu options
    inside the account dropdown.

    It updates the view mode signal so the sidebar switches its items,
    then navigates to the default route for the chosen mode.
  */
  setMode(mode: ViewMode): void {
    this.viewMode.setMode(mode);
    this.router.navigate([this.defaultRoutes[mode]]);
  }

}
