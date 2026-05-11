/*
  Component to represent the history view.

  This is a placeholder component that will be replaced with the actual history page.
*/
import { Component } from '@angular/core';

@Component({
  /*
    selector is the HTML tag used to render this component.
  */
  selector: 'app-history',

  /*
    template shows what the component displays.
  */
  template: `<div class="history-view"><h1>History</h1></div>`,

  /*
    styles defines the CSS for this component.
  */
  styles: [
    `
      .history-view {
        padding: 20px;
      }
    `,
  ],
})
export class HistoryComponent {}

