/*
  Component is used to declare that this class is an Angular component.
  inject is used to get an injectable service inside the class.
*/
import { Component, inject } from '@angular/core';

/*
  Router is used to navigate programmatically after logging out.
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
  MatDialog opens the ChangePasswordDialog when the user picks
  "Change password" from the account menu.
*/
import { MatDialog } from '@angular/material/dialog';

/*
  LanguageSwitcher is the component used to change the application language.
*/
import { LanguageSwitcher } from '../language-switcher/language-switcher';

/*
  For translations, we use the TranslatePipe from @ngx-translate/core.
*/
import { TranslatePipe } from '@ngx-translate/core';

/*
  AuthStore holds the authenticated user (see modules/iam/application/auth.store.ts).

  The account button used to open a menu that let anyone manually switch
  between "User View" and "Admin View" — that toggle has been removed.
  The sidebar now reflects the REAL role of whoever is logged in (resolved
  at login/register time), so the account menu's only job here is to show
  who is signed in and offer a way to log out.
*/
import { AuthStore } from '../../../../modules/iam/application/auth.store';

/*
  ChangePasswordDialog is opened from the account menu below. It works
  the same way regardless of role (admin or client), since the toolbar
  itself is shared across the whole authenticated app.
*/
import { ChangePasswordDialog } from '../../../../modules/iam/presentation/views/change-password-dialog/change-password-dialog';

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
    inject(AuthStore) gives this component access to the authenticated
    user's signal and the logout() action.
  */
  private authStore = inject(AuthStore);

  /*
    Router allows navigating programmatically to the login page
    once the session has been cleared.
  */
  private router = inject(Router);

  /*
    dialog opens ChangePasswordDialog when the user picks "Change
    password" from the account menu.
  */
  private dialog = inject(MatDialog);

  /*
    currentUser is read directly in the template to show the signed-in
    person's name and email inside the account menu.
  */
  currentUser = this.authStore.currentUser;

  /*
    logout clears the session (AuthStore + the sessionStorage keys shared
    with CurrentUserService/ViewModeService) and sends the user back to
    the login page.
  */
  logout(): void {
    this.authStore.logout();
    this.router.navigate(['/iam/login']);
  }

  /*
    openChangePassword opens ChangePasswordDialog as a Material dialog.
    No data needs to be passed in — the dialog reads the current user
    directly from AuthStore itself.
  */
  openChangePassword(): void {
    this.dialog.open(ChangePasswordDialog, { width: '420px' });
  }

}
