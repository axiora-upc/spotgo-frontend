/*
  MonitoringStore is the application layer of the monitoring bounded
  context. It holds the in-memory state seen by the views and is the
  only place that orchestrates the HTTP calls from MonitoringApi.

  Public API (consumed by the views):
  - readonly signals: employees, incidents, parkingSnapshot,
                      loading, error, employeeCount
  - imperative methods: addEmployee, updateEmployee, deleteEmployee,
                        refreshParkingSnapshot, loadEmployees,
                        loadIncidents.

  Why a Store?
  - Concentrates state mutation in one place so the views stay dumb.
  - Lets multiple components react to the same data without duplicating
    fetches.
  - Mirrors the LearningStore pattern used by the professor's example.
*/
import { Injectable, computed, inject, signal } from '@angular/core';
import { retry } from 'rxjs';
import { Employee } from '../domain/model/employee.entity';
import { IncidentReport } from '../domain/model/incident-report.entity';
import { ParkingSnapshot } from '../domain/model/parking-spot.entity';
import { MonitoringApi, ParkingResource } from '../infrastructure/monitoring-api';
import { Reservation } from '../domain/model/reservation.entity';

export interface DashboardStats {
  availableNearby: number;
  activeReservations: number;
  savedLocations: number;
  avgSavings: number;
}
import { ParkingAnalytics } from '../domain/model/analytics.entity';
import { MonitoringApi } from '../infrastructure/monitoring-api';

@Injectable({ providedIn: 'root' })
export class MonitoringStore {
  private readonly monitoringApi = inject(MonitoringApi);

  private readonly employeesSignal = signal<Employee[]>([]);
  readonly employees = this.employeesSignal.asReadonly();
  readonly employeeCount = computed(() => this.employeesSignal().length);

  private readonly incidentsSignal = signal<IncidentReport[]>([]);
  readonly incidents = this.incidentsSignal.asReadonly();

  private readonly parkingSnapshotSignal = signal<ParkingSnapshot | null>(null);
  readonly parkingSnapshot = this.parkingSnapshotSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  private readonly dashboardStatsSignal = signal<DashboardStats>({
    availableNearby: 0,
    activeReservations: 0,
    savedLocations: 0,
    avgSavings: 0,
  });
  readonly dashboardStats = this.dashboardStatsSignal.asReadonly();

  private readonly parkingsSignal = signal<ParkingResource[]>([]);
  readonly parkings = this.parkingsSignal.asReadonly();

  private readonly selectedParkingSignal = signal<ParkingResource | null>(null);
  readonly selectedParking = this.selectedParkingSignal.asReadonly();

  private readonly userReservationsSignal = signal<Reservation[]>([]);
  readonly userReservations = this.userReservationsSignal.asReadonly();

  /*
    employeesLoaded becomes true after the first fetch resolves. Used
    by the view to differentiate "still loading" from "loaded but
    empty" and show the proper empty state.
  */
  private readonly employeesLoadedSignal = signal(false);
  readonly employeesLoaded = this.employeesLoadedSignal.asReadonly();

  loadEmployees(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.monitoringApi.getEmployees().subscribe({
      next: (employees) => {
        this.employeesSignal.set(employees);
        this.employeesLoadedSignal.set(true);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.employeesLoadedSignal.set(true);
        this.errorSignal.set(this.formatError(err, 'Failed to load employees'));
        this.loadingSignal.set(false);
      },
    });
  }

  /*
    addEmployee, updateEmployee and deleteEmployee accept a "callbacks"
    object so the view can react to success/error (showing a snackbar,
    for example). The Store itself does NOT depend on Material or any
    UI library — that would tightly couple application logic to a
    specific UI framework.
  */
  addEmployee(
    employee: Employee,
    callbacks?: { onSuccess?: () => void; onError?: () => void }
  ): void {
    this.monitoringApi
      .addEmployee(employee)
      .pipe(retry(1))
      .subscribe({
        next: (created) => {
          this.employeesSignal.update((current) => [...current, created]);
          callbacks?.onSuccess?.();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to add employee'));
          callbacks?.onError?.();
        },
      });
  }

  updateEmployee(
    employee: Employee,
    callbacks?: { onSuccess?: () => void; onError?: () => void }
  ): void {
    this.monitoringApi
      .updateEmployee(employee)
      .pipe(retry(1))
      .subscribe({
        next: (updated) => {
          this.employeesSignal.update((current) =>
            current.map((e) => (e.id === updated.id ? updated : e))
          );
          callbacks?.onSuccess?.();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to update employee'));
          callbacks?.onError?.();
        },
      });
  }

  deleteEmployee(
    id: string,
    callbacks?: { onSuccess?: () => void; onError?: () => void }
  ): void {
    this.monitoringApi
      .deleteEmployee(id)
      .pipe(retry(1))
      .subscribe({
        next: () => {
          this.employeesSignal.update((current) =>
            current.filter((e) => e.id !== id)
          );
          callbacks?.onSuccess?.();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to delete employee'));
          callbacks?.onError?.();
        },
      });
  }

  loadIncidents(): void {
    this.monitoringApi.getIncidentReports().subscribe({
      next: (incidents) => this.incidentsSignal.set(incidents),
      error: (err) =>
        this.errorSignal.set(this.formatError(err, 'Failed to load incidents')),
    });
  }

  loadParkingSnapshot(): void {
    this.monitoringApi.getParkingSnapshot().subscribe({
      next: (snapshot) => this.parkingSnapshotSignal.set(snapshot),
      error: (err) =>
        this.errorSignal.set(this.formatError(err, 'Failed to load snapshot')),
    });
  }

  loadParkings(): void {
    this.monitoringApi.getParkings().subscribe({
      next: (parkings) => {
        this.parkingsSignal.set(parkings);
        this.dashboardStatsSignal.set({
          availableNearby: parkings.reduce((sum, p) => sum + p.availableSpaces, 0),
          activeReservations: this.userReservationsSignal().filter(r => r.status === 'completed').length,
          savedLocations: 5,
          avgSavings: 15.50,
        });
      },
      error: (err) =>
        this.errorSignal.set(this.formatError(err, 'Failed to load parkings')),
    });
  }

  selectParking(parking: ParkingResource | null): void {
    this.selectedParkingSignal.set(parking);
  }

  completeReservation(reservation: Reservation): void {
    this.userReservationsSignal.update(current => [...current, reservation]);
    // Update stats after reservation
    this.dashboardStatsSignal.update(stats => ({
      ...stats,
      activeReservations: this.userReservationsSignal().filter(r => r.status === 'completed').length
    }));
  }

  updateReservation(reservation: Reservation): void {
    this.userReservationsSignal.update(current => 
      current.map(r => r.id === reservation.id ? reservation : r)
    );
    // Sync stats after updating reservation
    this.dashboardStatsSignal.update(stats => ({
      ...stats,
      activeReservations: this.userReservationsSignal().filter(r => r.status === 'completed').length
    }));
  }

  /*
    Refreshes the snapshot AND updates facility.lastUpdated to the
    current client time, persisting the change in db.json.

    callbacks let the Overview view know when the refresh starts and
    finishes so it can toggle the spinner state of the button.
  */
  refreshParkingSnapshot(
    callbacks?: { onSuccess?: () => void; onError?: () => void }
  ): void {
    this.monitoringApi.touchParkingSnapshotLastUpdated().subscribe({
      next: (snapshot) => {
        this.parkingSnapshotSignal.set(snapshot);
        callbacks?.onSuccess?.();
      },
      error: (err) => {
        this.errorSignal.set(
          this.formatError(err, 'Failed to refresh snapshot')
        );
        callbacks?.onError?.();
      },
    });
  }

  loadDashboardStats(): void {
    this.dashboardStatsSignal.set({
      availableNearby: 12,
      activeReservations: 3,
      savedLocations: 5,
      avgSavings: 15.50,
    });
  }

  private formatError(err: any, fallback: string): string {
    if (err instanceof Error) {
      return err.message.includes('Resource not found')
        ? `${fallback}: not found`
        : err.message;
    }
    return fallback;
  }

  /* ─── Analytics ──────────────────────────────────────────────────────────── */

  /*
    analyticsSignal almacena el agregado ParkingAnalytics del parking
    del administrador autenticado. La vista AnalyticsComponent lo lee
    a través del readonly signal analytics().
  */
  private readonly analyticsSignal = signal<ParkingAnalytics | null>(null);
  readonly analytics = this.analyticsSignal.asReadonly();

  private readonly analyticsLoadingSignal = signal(false);
  readonly analyticsLoading = this.analyticsLoadingSignal.asReadonly();

  /*
    Carga el agregado completo de analytics para el parking dado.
    El componente lo llama en ngOnInit con el id del parking del admin.
  */
  loadAnalytics(parkingId: string): void {
    this.analyticsLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.monitoringApi.getAnalytics(parkingId).subscribe({
      next: (data) => {
        this.analyticsSignal.set(data);
        this.analyticsLoadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to load analytics'));
        this.analyticsLoadingSignal.set(false);
      },
    });
  }
}
