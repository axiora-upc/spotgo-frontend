/*
  Component is used to declare that this class is an Angular component.
*/
import { Component } from '@angular/core';

/*
  MatToolbar and MatToolbarRow are Angular Material components.

  They are used to create the top toolbar structure.
*/
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';

/*
  MatButton is used to create Material buttons inside the toolbar.
*/

import { MatButton } from '@angular/material/button';
import { MatIconButton } from '@angular/material/button';

/*
  MatIcon is used to show Angular Material icons.

  Example:
  <mat-icon>account_circle</mat-icon>
  <mat-icon>add_alert</mat-icon>
*/
import { MatIcon } from '@angular/material/icon';

/*
  LanguageSwitcher is the component used to change the application language.
*/
import { LanguageSwitcher } from '../language-switcher/language-switcher';

/*
  For translations, we use the TranslatePipe from @ngx-translate/core.
*/
import { TranslatePipe } from '@ngx-translate/core';

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
    - mat-button
    - <mat-icon>
    - <app-language-switcher>
  */
  imports: [
    MatToolbar,
    MatToolbarRow,
    MatIconButton,
    MatIcon,
    LanguageSwitcher,
    TranslatePipe
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
export class ToolbarContent {}
