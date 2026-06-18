/*
  HistoryComponent is the presentation layer for the parking history view.

  Responsibilities:
    - Load history from the store on init.
    - Provide formatting helpers (date, time, amount).
    - Manage the rating modal state (which item, hovered stars, selected stars).
    - Manage the report modal state (which item, selected report type).

  The store is the only dependency — the component never calls HistoryApi
  directly. All state updates flow through store actions.

  Modal pattern:
    ratingTarget signal → null = modal closed, item = modal open for that item
    reportTarget signal → null = modal closed, item = modal open for that item
*/
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { HistoryStore } from '../../../application/history.store';
import { ParkingHistory } from '../../../domain/model/parking-history.entity';
import { ReportType } from '../../../domain/model/client-report.entity';
import { CurrentUserService } from '../../../../../shared/services/current-user.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [DecimalPipe, FormsModule, TranslatePipe],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
})
export class HistoryComponent implements OnInit {
  protected readonly store       = inject(HistoryStore);
  private  readonly currentUser  = inject(CurrentUserService);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 5;

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.store.history().length / this.pageSize))
  );

  protected readonly pagedHistory = computed(() => {
    const safePage = Math.min(this.currentPage(), this.totalPages());
    const start = (safePage - 1) * this.pageSize;
    return this.store.history().slice(start, start + this.pageSize);
  });

  protected readonly pageStart = computed(() => {
    if (this.store.history().length === 0) return 0;
    return (Math.min(this.currentPage(), this.totalPages()) - 1) * this.pageSize + 1;
  });

  protected readonly pageEnd = computed(() =>
    Math.min(this.pageStart() + this.pagedHistory().length - 1, this.store.history().length)
  );

  protected readonly shouldShowPagination = computed(() =>
    this.store.history().length > this.pageSize
  );

  ngOnInit(): void {
    this.store.loadHistoryByClientId(this.currentUser.clientId);
  }

  /* ── Formatting helpers ───────────────────────────────────────────── */

  /*
    Formats an ISO date string to "2026-04-12" display format.
    Uses UTC to avoid timezone shifts between the stored date and display.
  */
  protected formatDate(iso: string): string {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /*
    Extracts the HH:MM portion from an ISO date string using UTC,
    e.g. "2026-04-12T09:00:00Z" → "09:00".
  */
  protected formatTime(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  /*
    Returns an array [1, 2, 3, 4, 5] used by @for in the template
    to render five star elements for a rated reservation.
  */
  protected readonly stars = [1, 2, 3, 4, 5];

  /* ── Rating modal ─────────────────────────────────────────────────── */

  /*
    Which history item the rating modal is currently open for.
    null means the modal is closed.
  */
  protected readonly ratingTarget = signal<ParkingHistory | null>(null);

  /*
    The star the user is currently hovering over (0 = no hover).
    Drives the visual highlight before the user clicks.
  */
  protected readonly hoverStars = signal(0);

  /*
    The star the user has clicked/selected in the modal.
    0 = nothing selected yet (the confirm button is disabled).
  */
  protected readonly selectedStars = signal(0);

  /*
    Returns the number of stars to highlight:
    hovering takes priority over the clicked selection so the user
    can preview different ratings before confirming.
  */
  protected activeStars(): number {
    return this.hoverStars() || this.selectedStars();
  }

  protected onOpenRate(item: ParkingHistory): void {
    this.selectedStars.set(item.rating ?? 0);
    this.hoverStars.set(0);
    this.ratingTarget.set(item);
  }

  protected onStarHover(n: number): void  { this.hoverStars.set(n); }
  protected onStarLeave(): void           { this.hoverStars.set(0); }
  protected onStarClick(n: number): void  { this.selectedStars.set(n); }

  protected onCancelRate(): void { this.ratingTarget.set(null); }

  protected onConfirmRate(): void {
    const item  = this.ratingTarget();
    const stars = this.selectedStars();
    if (!item || stars === 0) return;

    this.store.rateReservation(item.id, stars, {
      onSuccess: () => this.ratingTarget.set(null),
    });
  }

  /* ── Report modal ─────────────────────────────────────────────────── */

  /*
    Which history item the report modal is currently open for.
    null means the modal is closed.
  */
  protected readonly reportTarget = signal<ParkingHistory | null>(null);

  /*
    The report type the user selected in the dropdown.
    Empty string = nothing selected yet (the submit button is disabled).
  */
  protected readonly reportType = signal<ReportType | ''>('');

  /*
    The available report type options.
    Keys match the i18n translation keys in history.report.types.*
  */
  protected readonly reportTypes: ReportType[] = [
    'safety-concern',
    'maintenance-issue',
    'billing-dispute',
    'other',
  ];

  protected onOpenReport(item: ParkingHistory): void {
    this.reportType.set('');
    this.reportTarget.set(item);
  }

  protected onCancelReport(): void { this.reportTarget.set(null); }

  protected onConfirmReport(): void {
    const item = this.reportTarget();
    const type = this.reportType();
    if (!item || !type) return;

    this.store.submitReport(item.id, item.parkingId, type as ReportType, {
      onSuccess: () => this.reportTarget.set(null),
    });
  }

  protected goToPreviousPage(): void {
    this.currentPage.update((page) => Math.max(1, page - 1));
  }

  protected goToNextPage(): void {
    this.currentPage.update((page) => Math.min(this.totalPages(), page + 1));
  }
}
