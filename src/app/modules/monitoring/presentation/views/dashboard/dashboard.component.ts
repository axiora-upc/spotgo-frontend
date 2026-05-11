/*
  Component to represent the dashboard view.

  This is a placeholder component that will be replaced with the actual dashboard.
*/
import { Component } from '@angular/core';

@Component({
  /*
    selector is the HTML tag used to render this component.
  */
  selector: 'app-dashboard',

  /*
    template shows what the component displays.
  */
  template: `<div class="dashboard-view"><h1>Dashboard</h1></div>`,

  /*
    styles defines the CSS for this component.
  */
  styles: [
    `
      .dashboard-view {
        padding: 20px;
      }
    `,
  ],
})
export class DashboardComponent {}

