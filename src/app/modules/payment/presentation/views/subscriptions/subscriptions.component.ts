/*
  Component to represent the subscriptions view.

  This is a placeholder component that will be replaced with the actual subscriptions page.
*/
import { Component } from '@angular/core';

@Component({
  /*
    selector is the HTML tag used to render this component.
  */
  selector: 'app-subscriptions',

  /*
    template shows what the component displays.
  */
  template: `<div class="subscriptions-view"><h1>Subscriptions</h1></div>`,

  /*
    styles defines the CSS for this component.
  */
  styles: [
    `
      .subscriptions-view {
        padding: 20px;
      }
    `,
  ],
})
export class SubscriptionsComponent {}

