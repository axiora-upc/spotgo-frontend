/*
  Component is used to declare that this class is an Angular component.
*/

import { Component } from '@angular/core';

/*
  TanslatePipe is used to translate the text in the footer 
  to the user's language.
*/

import {TranslatePipe} from '@ngx-translate/core';

/*
  A component in Angular is a class that controls
  a part of the user interface. Angular understands that
  this class is a component because of the @Component
  decorator above it.
*/

@Component({

  /*
    Selector is the name of the HTML tag that
    will be used to include this component
    in other parts of the application.

    <app-footer-content></app-footer-content> 
    will render this component.
  */
 
  selector: 'app-footer-content',

    /*
    imports defines the components, directives, and pipes
    that can be used inside this component's HTML template.

    In this case, footer-content.html can use:
    - TranslatePipe with the | translate syntax
    */
  imports: [
    TranslatePipe
  ],

  /*
    templateUrl defines which HTML file contains the structure
    of this component.

    In this case, footer-content.html contains the visual structure
    of the FooterContent component.
  */
  templateUrl: './footer-content.html',

  /*
    styleUrl defines which CSS file contains the styles
    for this component.

    In this case, footer-content.css styles the elements written
    in footer-content.html.
  */
  styleUrl: './footer-content.css',
})
export class FooterContent {

}
