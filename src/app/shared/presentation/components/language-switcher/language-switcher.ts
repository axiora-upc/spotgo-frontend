/*
  Component is used to declare that this class is an Angular component.
*/
import { Component } from '@angular/core';

/*
  TranslateService is used to control the active language of the application.

  With this service we can:
  - get the current language
  - change the language to English, Spanish, etc.
*/
import { TranslateService } from '@ngx-translate/core';

/*
  MatButtonToggleGroup and MatButtonToggle are Angular Material components.

  They are used to create a group of selectable buttons,
  for example: EN | ES.
*/
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { TranslatePipe } from '@ngx-translate/core';

/*
  A component in Angular is a class that controls
  a part of the user interface.

  Angular understands that this class is a component
  because of the @Component decorator.
*/
@Component({
  /*
    selector is the HTML tag used to render this component
    in another component's template.

    Example:
    <app-language-switcher></app-language-switcher>
  */
  selector: 'app-language-switcher',

  /*
    imports defines the components, directives, and pipes
    that can be used inside this component's HTML template.

    In this case, language-switcher.html can use:
    - <mat-button-toggle-group>
    - <mat-button-toggle>
  */
  imports: [
    MatButtonToggleGroup,
    MatButtonToggle,
    TranslatePipe
  ],

  /*
    templateUrl defines which HTML file contains the structure
    of this component.

    In this case, language-switcher.html contains the visual structure
    of the LanguageSwitcher component.
  */
  templateUrl: './language-switcher.html',

  /*
    styleUrl defines which CSS file contains the styles
    for this component.

    In this case, language-switcher.css styles the elements written
    in language-switcher.html.
  */
  styleUrl: './language-switcher.css',
})
export class LanguageSwitcher {
  
    /*
    My atributes are:
    currentLanguage stores the active language of the application.
    It starts with 'en' as a default value. Means English
  */
  currentLanguage = 'en';

  /*
    languages contains the list of languages available in the application.
    'en' means English.
    'es' means Spanish.
  */
  languages = ['en', 'es'];

  /*
    The constructor runs when Angular creates this component.

    private translate: TranslateService means:
    - Angular gives this component the TranslateService automatically.
    - The service is stored in a private property called translate.
    - We can use this.translate inside the class.

    translate.getCurrentLang() gets the current active language
    from ngx-translate.

    Then we save that value in currentLanguage.
  */
  constructor(private translate: TranslateService) {
    this.currentLanguage = translate.getCurrentLang();
  }

  /*
    useLanguage changes the active language of the application.

    It receives a language code, for example:
    - 'en'
    - 'es'

    this.translate.use(language) tells ngx-translate
    to use that language.

    this.currentLanguage = language updates the local value
    so the UI knows which language is currently selected.
  */
  useLanguage(language: string) {
    this.translate.use(language);
    this.currentLanguage = language;
  }
  
}