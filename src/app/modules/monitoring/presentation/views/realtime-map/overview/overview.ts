/*
  Overview view of the Real-time Map page.

  Consumes MonitoringStore for the parking snapshot. The "Refresh
  Sync" button delegates to store.refreshParkingSnapshot(), which
  PATCHes facility.lastUpdated on the backend and pushes the merged
  snapshot back into the store signal so the UI re-renders.

  A local `refreshing` signal toggles the spinner state of the button
  while the request is in flight.
*/
import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import { MonitoringStore } from '../../../../application/monitoring.store';

@Component({
  selector: 'app-realtime-map-overview',
  imports: [CurrencyPipe, DecimalPipe, NgClass, MatIcon, TranslatePipe],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview implements OnInit {
  protected readonly store = inject(MonitoringStore);

  protected readonly refreshing = signal(false);

  ngOnInit(): void {
    this.store.loadParkingSnapshot();
  }

  /*
    Bound to the Refresh Sync button. Toggles the local spinner state
    while the Store fetches & persists the new lastUpdated.
  */
  protected refresh(): void {
    if (this.refreshing()) {
      return;
    }
    this.refreshing.set(true);
    this.store.refreshParkingSnapshot({
      onSuccess: () => this.refreshing.set(false),
      onError: () => this.refreshing.set(false),
    });
  }
}
