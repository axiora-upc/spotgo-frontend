/*
  RealtimeMap is the parent of the three Real-time Map sub-routes:
  - overview
  - reports
  - employees

  The application's global Layout already provides the toolbar and the
  sidebar, so this component does NOT duplicate that chrome. It only
  adds a thin internal tab bar so the admin can switch between the
  three views, and a <router-outlet /> for the active child route.
*/
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-realtime-map',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './realtime-map.html',
  styleUrl: './realtime-map.css',
})
export class RealtimeMap {

  readonly tabs = [
    { link: 'overview', label: 'realtime-map.tabs.overview' },
    { link: 'reports', label: 'realtime-map.tabs.reports' },
    { link: 'employees', label: 'realtime-map.tabs.employees' },
  ];
}
