/*
  Component to represent the receipts view.

  This is a placeholder component that will be replaced with the actual receipts page.
*/
import { Component } from '@angular/core';

@Component({
  /*
    selector is the HTML tag used to render this component.
  */
  selector: 'app-receipts',

  /*
    template shows what the component displays.
  */
  template: `<div class="receipts-view"><h1>Receipts</h1></div>`,

  /*
    styles defines the CSS for this component.
  */
  styles: [
    `
      .receipts-view {
        padding: 20px;
      }
    `,
  ],
})
export class ReceiptsComponent {}

