/*
  Reports view of the Real-time Map page.

  Admins see the reports submitted by clients for the parking they manage.
  Reports are stored in /clientReports and linked to reservations by
  reservationId so the UI can show the spot and booking code.
*/
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../../environments/environment';

import { ClientReport } from '../../../../../parking/domain/model/client-report.entity';
import { ReservationRaw } from '../../../../../parking/domain/model/reservation-raw.entity';
import { HistoryApi } from '../../../../../parking/infrastructure/history-api';
import { CurrentUserService } from '../../../../../../shared/services/current-user.service';

interface AdminReportView {
  id: string | number;
  clientId: string;
  clientName: string;
  code: string;
  date: string;
  icon: string;
  reservationCode: string;
  resolved: boolean;
  resolveButtonKey: string;
  spot: string;
  status: string;
  statusKey: string;
  time: string;
  type: string;
}

interface UserLookupResource {
  id: string;
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-realtime-map-reports',
  imports: [MatIcon, TranslatePipe],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  private readonly historyApi = inject(HistoryApi);
  private readonly currentUser = inject(CurrentUserService);
  private readonly http = inject(HttpClient);

  readonly reports = signal<AdminReportView[]>([]);
  readonly loading = signal(true);
  readonly currentPage = signal(1);
  readonly pageSize = 5;

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.reports().length / this.pageSize))
  );

  readonly pagedReports = computed(() => {
    const safePage = Math.min(this.currentPage(), this.totalPages());
    const start = (safePage - 1) * this.pageSize;
    return this.reports().slice(start, start + this.pageSize);
  });

  readonly pageStart = computed(() => {
    if (this.reports().length === 0) return 0;
    return (Math.min(this.currentPage(), this.totalPages()) - 1) * this.pageSize + 1;
  });

  readonly pageEnd = computed(() =>
    Math.min(this.pageStart() + this.pagedReports().length - 1, this.reports().length)
  );

  readonly shouldShowPagination = computed(() =>
    this.reports().length > this.pageSize
  );

  ngOnInit(): void {
    this.loadReports();
  }

  private loadReports(): void {
    forkJoin({
      reports: this.historyApi.getClientReports(),
      reservations: this.historyApi.getReservations(),
      users: this.http.get<UserLookupResource[]>(`${environment.apiUrl}/users`),
    }).subscribe({
      next: ({ reports, reservations, users }) => {
        const reservationMap = new Map(reservations.map((reservation) => [reservation.id, reservation]));
        const userMap = new Map(users.map((user) => [user.id, `${user.firstName} ${user.lastName}`.trim()]));

        const filtered = reports
          .filter((report) => report.parkingId === this.currentUser.parkingId)
          .map((report) => this.toViewModel(report, reservationMap.get(report.reservationId), userMap.get(report.clientId) ?? report.clientId))
          .sort((a, b) => this.compareReports(a, b));

        this.reports.set(filtered);
        this.currentPage.set(1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private toViewModel(report: ClientReport, reservation: ReservationRaw | undefined, clientName: string): AdminReportView {
    const resolved = report.status === 'resolved';

    return {
      id: report.id,
      clientId: report.clientId,
      clientName,
      code: report.code,
      date: this.formatDate(report.date),
      icon: resolved ? 'check_circle' : 'error',
      reservationCode: reservation?.code ?? report.reservationId,
      resolved,
      resolveButtonKey: resolved
        ? 'realtime-map.reports.resolved-button'
        : 'realtime-map.reports.resolve-button',
      spot: reservation?.spot ?? '-',
      status: report.status,
      statusKey: `realtime-map.reports.status.${report.status}`,
      time: this.formatTime(report.date),
      type: report.type,
    };
  }

  markAsResolved(report: AdminReportView): void {
    if (report.resolved) return;

    this.historyApi.updateClientReportStatus(report.id, 'resolved').subscribe({
      next: (updated) => {
        this.reports.update((reports) =>
          reports
            .map((item) =>
            item.id === report.id
              ? {
                  ...item,
                  icon: 'check_circle',
                  resolved: true,
                  resolveButtonKey: 'realtime-map.reports.resolved-button',
                  status: updated.status,
                  statusKey: `realtime-map.reports.status.${updated.status}`,
                }
              : item
            )
            .sort((a, b) => this.compareReports(a, b))
        );
      },
      error: (err) => {
        console.error('Failed to resolve report', err);
      },
    });
  }

  goToPreviousPage(): void {
    this.currentPage.update((page) => Math.max(1, page - 1));
  }

  goToNextPage(): void {
    this.currentPage.update((page) => Math.min(this.totalPages(), page + 1));
  }

  private formatTime(iso: string): string {
    const date = new Date(iso);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private formatDate(iso: string): string {
    return iso.split('T')[0];
  }

  private compareReports(a: AdminReportView, b: AdminReportView): number {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    return `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`);
  }
}
