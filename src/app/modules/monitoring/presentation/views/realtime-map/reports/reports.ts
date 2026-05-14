/*
  Reports view of the Real-time Map page.

  After the DDD refactor the component is a thin UI layer that simply
  asks MonitoringStore for the incidents and renders them. The Store
  owns the signal; this component does not subscribe to HttpClient.
*/
import { Component, OnInit, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import { MonitoringStore } from '../../../../application/monitoring.store';

@Component({
  selector: 'app-realtime-map-reports',
  imports: [MatIcon, TranslatePipe],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  protected readonly store = inject(MonitoringStore);

  ngOnInit(): void {
    this.store.loadIncidents();
  }
}
