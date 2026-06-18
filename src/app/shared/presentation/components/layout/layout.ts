/*
  Component is used to declare that this class is an Angular component.
*/
import { Component } from '@angular/core';

/*
  RouterOutlet is used to render the current page inside the layout.
  For example, Dashboard, Reservations, Subscription, Receipts, Favorites or History.
*/
import { RouterOutlet } from '@angular/router';

/*
  SidebarContent is the component that shows the sidebar of the application.
  ToolbarContent is the component that shows the top toolbar of the application.
  FooterContent is the component that shows the footer of the application.
*/
import { SidebarContent } from '../sidebar-content/sidebar-content';
import { ToolbarContent } from '../toolbar-content/toolbar-content';

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

    <app-layout></app-layout> will render this component.
  */
  selector: 'app-layout',

  /*
    imports defines the components, directives, and pipes
    that can be used inside this component's HTML template.

    In this case, layout.html can use:
    - <app-toolbar-content>
    - <app-sidebar-content>
    - <router-outlet>
    - <app-footer-content>
  */
  imports: [ToolbarContent, SidebarContent, RouterOutlet],

  /*
    templateUrl defines which HTML file contains the structure
    of this component.

    In this case, layout.html contains the visual structure
    of the Layout component.
  */
  templateUrl: './layout.html',

  /*
    styleUrl defines which CSS file contains the styles
    for this component.

    In this case, layout.css styles the elements written
    in layout.html.
  */
  styleUrl: './layout.css',
})
export class Layout {}
