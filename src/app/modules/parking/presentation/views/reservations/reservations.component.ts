/*
  Component to represent the reservations view.

  This is a placeholder component that will be replaced with the actual reservations page.
*/
import { Component } from '@angular/core';

@Component({
  /*
    selector is the HTML tag used to render this component.
  */
  selector: 'app-reservations',

  /*
    template shows what the component displays.
  */
  template: `<div class="reservations-view"><h1>Reservations</h1></div>`,

  /*
    styles defines the CSS for this component.
  */
  styles: [
    `
      .reservations-view {
        padding: 20px;
      }
    `,
  ],
})
export class ReservationsComponent {}

