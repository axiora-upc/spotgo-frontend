/*
  MonitoringStore is the application layer of the monitoring bounded
  context. It holds the in-memory state seen by the views and is the
  only place that orchestrates the HTTP calls from MonitoringApi.

  Public API (consumed by the views):
  - readonly signals: employees, parkingSnapshot,
                      loading, error, employeeCount
  - imperative methods: addEmployee, updateEmployee, deleteEmployee,
                        refreshParkingSnapshot, loadEmployees.

  Why a Store?
  - Concentrates state mutation in one place so the views stay dumb.
  - Lets multiple components react to the same data without duplicating
    fetches.
  - Mirrors the LearningStore pattern used by the professor's example.
*/
import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin, retry } from 'rxjs';
import { formatError } from '../../../shared/utils/format-error';
import { Employee } from '../domain/model/employee.entity';
import {
  Facility,
  ParkingRow,
  ParkingSnapshot,
  ParkingSpot,
  ParkingStats,
  PeakHour,
} from '../domain/model/parking-spot.entity';
import { DetectedSpot } from '../../profiles/domain/model/detected-spot.entity';
import { MonitoringApi, ParkingResource } from '../infrastructure/monitoring-api';
import { Reservation, ReservationStatus } from '../domain/model/reservation.entity';
import { ParkingAnalytics } from '../domain/model/analytics.entity';

import { HistoryApi } from '../../parking/infrastructure/history-api';
import { PaymentApi } from '../../payment/infrastructure/payment-api';
import { PaymentStore } from '../../payment/application/payment.store';
import { ReservationRaw } from '../../parking/domain/model/reservation-raw.entity';
import { Receipt } from '../../payment/domain/model/receipt.entity';
import { CurrentUserService } from '../../../shared/services/current-user.service';

@Injectable({ providedIn: 'root' })
export class MonitoringStore {
  private readonly monitoringApi  = inject(MonitoringApi);
  private readonly historyApi     = inject(HistoryApi);
  private readonly paymentApi     = inject(PaymentApi);
  private readonly paymentStore   = inject(PaymentStore);
  private readonly currentUser    = inject(CurrentUserService);
  private readonly adminParkingIdSignal = signal('');

  private readonly employeesSignal = signal<Employee[]>([]);
  readonly employees = this.employeesSignal.asReadonly();
  readonly employeeCount = computed(() => this.employeesSignal().length);

  private readonly parkingSnapshotSignal = signal<ParkingSnapshot | null>(null);
  readonly parkingSnapshot = this.parkingSnapshotSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

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
    forkJoin({
      employees: this.monitoringApi.getEmployees(),
      parkings: this.monitoringApi.getParkings(),
    }).subscribe({
      next: ({ employees, parkings }) => {
        const adminParkingId = parkings.find(
          (parking) => parking.adminId === this.currentUser.adminId
        )?.id ?? this.currentUser.parkingId;

        this.adminParkingIdSignal.set(adminParkingId);
        this.employeesSignal.set(
          employees.filter((employee) => employee.parkingId === adminParkingId)
        );
        this.employeesLoadedSignal.set(true);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.employeesLoadedSignal.set(true);
        this.errorSignal.set(formatError(err, 'Failed to load employees'));
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
    employee.parkingId = this.adminParkingIdSignal() || this.currentUser.parkingId;

    this.monitoringApi
      .addEmployee(employee)
      .pipe(retry(1))
      .subscribe({
        next: (created) => {
          if (created.parkingId === (this.adminParkingIdSignal() || this.currentUser.parkingId)) {
            this.employeesSignal.update((current) => [...current, created]);
          }
          callbacks?.onSuccess?.();
        },
        error: (err) => {
          this.errorSignal.set(formatError(err, 'Failed to add employee'));
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
          this.employeesSignal.update((current) => {
            if (updated.parkingId !== (this.adminParkingIdSignal() || this.currentUser.parkingId)) {
              return current.filter((e) => e.id !== updated.id);
            }
            return current.map((e) => (e.id === updated.id ? updated : e));
          });
          callbacks?.onSuccess?.();
        },
        error: (err) => {
          this.errorSignal.set(formatError(err, 'Failed to update employee'));
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
          this.errorSignal.set(formatError(err, 'Failed to delete employee'));
          callbacks?.onError?.();
        },
      });
  }

  loadParkings(): void {
    forkJoin({
      parkings:      this.monitoringApi.getParkings(),
      reservations:  this.historyApi.getReservations(),
      detectedSpots: this.monitoringApi.getDetectedSpots(),
    }).subscribe({
      next: ({ parkings, reservations, detectedSpots }) => {
        const now = Date.now();

        const maintenanceByParking = new Map<string, number>();
        detectedSpots.forEach(s => {
          if (s.status === 'maintenance')
            maintenanceByParking.set(s.parkingId, (maintenanceByParking.get(s.parkingId) ?? 0) + 1);
        });

        const reconciled = parkings.map(p => {
          const occupied = reservations.filter(
            r => r.parkingId === p.id &&
                 r.status === 'active' &&
                 new Date(r.endDate).getTime() > now
          ).length;
          const maintenance = maintenanceByParking.get(p.id) ?? 0;
          const ratedForParking = reservations.filter(
            r => r.parkingId === p.id && r.rating !== null
          );
          const rating = ratedForParking.length === 0
            ? p.rating
            : Math.round(
                ratedForParking.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratedForParking.length * 10
              ) / 10;
          return { ...p, availableSpaces: Math.max(0, p.totalSpaces - occupied - maintenance), rating };
        });
        this.parkingsSignal.set(reconciled);
      },
      error: (err) =>
        this.errorSignal.set(formatError(err, 'Failed to load parkings')),
    });
  }

  selectParking(parking: ParkingResource | null): void {
    this.selectedParkingSignal.set(parking);
  }

  completeReservation(reservation: Reservation): void {
    this.userReservationsSignal.update(current => [...current, reservation]);

    // Compute absolute times for SQL/JSON server persistence
    const [year, month, day] = reservation.date.split('-').map(Number);
    const [hour, min] = reservation.startTime.split(':').map(Number);
    const startObj = new Date(year, month - 1, day, hour, min);
    const endObj = new Date(startObj.getTime() + reservation.duration * 60 * 60 * 1000);

    // 1. Construct raw persistent representation for user history (POST /reservations)
    const rawRes = new ReservationRaw(
      reservation.id,
      this.currentUser.clientId,
      reservation.parkingId,
      reservation.code,
      reservation.spotId,
      startObj.toISOString(),
      endObj.toISOString(),
      'active',
      reservation.totalAmount,
      reservation.baseAmount ?? reservation.totalAmount,
      null // unrated
    );

    // 2. Construct transactional representation for receipts history (POST /receipts)
    const invoiceId = `INV-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${reservation.code}`;
    const matchedPkg = this.parkingsSignal().find(p => p.id === reservation.parkingId);
    const pkgName = matchedPkg ? matchedPkg.name : 'SpotGo Parking';
    
    const finalReceipt = new Receipt({
      id: '', // assigned by backend
      clientId: this.currentUser.clientId,
      invoiceNumber: invoiceId,
      locationName: pkgName,
      date: rawRes.startDate,
      durationHours: Math.floor(reservation.duration),
      durationMinutes: Math.round((reservation.duration % 1) * 60),
      paymentMethod: 'Visa •• 4242',
      bookingCode: reservation.code,
      amount: reservation.totalAmount,
      status: 'paid'
    });

    // 3. Persist reservation and reload the list so My Reservations shows it immediately.
    // Without the reload, there's a race: loadUserReservations() in the reservations
    // page could run before the POST finishes, leaving the list empty.
    this.historyApi.createReservation(rawRes).subscribe({
      next: () => this.loadUserReservations(),
    });
    this.paymentApi.addReceipt(finalReceipt).subscribe();
  }

  updateReservation(reservation: Reservation): void {
    this.userReservationsSignal.update(current =>
      current.map(r => r.id === reservation.id ? reservation : r)
    );
  }

  // Elimina la reserva de la base de datos (hard DELETE) y la quita del signal.
  // El callback onSuccess permite que el componente libere el spot en el blueprint.
  cancelReservation(
    reservation: Reservation,
    callbacks?: { onSuccess?: () => void; onError?: () => void }
  ): void {
    this.userReservationsSignal.update(current =>
      current.filter(r => r.id !== reservation.id)
    );

    // Delete the associated receipt so it doesn't appear in Receipts / Avg. Savings
    this.paymentApi.deleteReceiptByCode(reservation.code).subscribe();

    // Reverse savings: savings = discountedAmount * discountPct / (100 - discountPct)
    const discountPct = this.paymentStore.currentDiscount();
    if (discountPct > 0) {
      const savings = Math.round(reservation.totalAmount * discountPct / (100 - discountPct) * 100) / 100;
      this.paymentStore.subtractFromSavedThisMonth(savings);
    }

    this.historyApi.setReservationStatus(reservation.id, 'cancelled').subscribe({
      next: () => callbacks?.onSuccess?.(),
      error: () => callbacks?.onError?.(),
    });
  }

  loadUserReservations(): void {
    this.paymentStore.loadSubscriptionByClientId(this.currentUser.clientId);
    this.historyApi.getReservations().subscribe({
      next: (rawReservations) => {
        const now = Date.now();
        // Filter by client, ignore past reservations, map to domain structure
        const mapped = rawReservations
          .filter(r => r.clientId === this.currentUser.clientId)
          .filter(r => r.status === 'active' && new Date(r.endDate).getTime() > now)
          .map(r => this.mapRawToReservation(r));
          
        this.userReservationsSignal.set(mapped);
      },
    });
  }

  private mapRawToReservation(raw: ReservationRaw): Reservation {
    const start = new Date(raw.startDate);
    const end = new Date(raw.endDate);

    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const day = String(start.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const hour = String(start.getHours()).padStart(2, '0');
    const min = String(start.getMinutes()).padStart(2, '0');
    const timeStr = `${hour}:${min}`;

    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    return {
      id: raw.id,
      code: raw.code,
      parkingId: raw.parkingId,
      spotId: raw.spot,
      date: dateStr,
      startTime: timeStr,
      duration: duration,
      totalAmount: raw.amount,
      status: raw.status as ReservationStatus,
    };
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
    const snapshot = this.parkingSnapshotSignal();
    if (!snapshot) {
      callbacks?.onSuccess?.();
      return;
    }
    snapshot.facility.lastUpdated = new Date().toLocaleTimeString('en-US', { hour12: false });
    this.parkingSnapshotSignal.set(new ParkingSnapshot({
      facility: snapshot.facility,
      stats: snapshot.stats,
      rows: snapshot.rows,
    }));
    callbacks?.onSuccess?.();
  }

  clearParkingSnapshot(): void {
    this.parkingSnapshotSignal.set(null);
  }

  // Updates the in-memory available-spaces count for one parking without
  // a round-trip. Called right after the server PATCH in parking-details-dialog
  // or reservations so the dashboard bubbles reflect the change immediately.
  updateParkingAvailableSpaces(parkingId: string, availableSpaces: number): void {
    this.parkingsSignal.update(parkings =>
      parkings.map(p => p.id === parkingId ? { ...p, availableSpaces } : p)
    );
  }

  // Construye un ParkingSnapshot a partir de los spots detectados en el croquis
  // y lo guarda en el signal para que Overview lo renderice igual que si viniera del API.
  loadBlueprintSnapshot(spots: DetectedSpot[], name = 'Croquis', revenue?: number, peakHours?: PeakHour[]): void {
    if (spots.length === 0) return;

    const GRID_COLS = 8;

    const rowMap = new Map<number, Map<number, DetectedSpot>>();
    for (const spot of spots) {
      if (!rowMap.has(spot.row)) rowMap.set(spot.row, new Map());
      rowMap.get(spot.row)!.set(spot.col, spot);
    }

    const rows: ParkingRow[] = [];
    const sortedRowKeys = [...rowMap.keys()].sort((a, b) => a - b);

    for (const rowKey of sortedRowKeys) {
      const rowLabel = String.fromCharCode(65 + rowKey);
      const colMap   = rowMap.get(rowKey)!;
      const parkingSpots: ParkingSpot[] = [];

      for (let col = 0; col < GRID_COLS; col++) {
        const detected = colMap.get(col);
        parkingSpots.push(new ParkingSpot({
          id:     `${rowLabel}${col + 1}`,
          status: detected ? (detected.status ?? 'available') : 'empty',
          dbId:   detected?.code,
        }));
      }

      rows.push(new ParkingRow({ id: rowLabel, spots: parkingSpots }));
    }

    const total     = spots.length;
    const available = spots.filter(s => (s.status ?? 'available') === 'available').length;
    const occupied  = spots.filter(s => s.status === 'occupied').length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 1000) / 10 : 0;
    const revenueYield  = revenue ?? this.parkingSnapshotSignal()?.stats.revenueYield ?? 0;

    const stats = new ParkingStats({
      totalSpaces:            total,
      currentlyAvailable:     available,
      availableTrendPercent:  0,
      occupancyRate,
      revenueYield,
      revenueTrendPercent:    0,
      peakHours: peakHours ?? Array.from({ length: 24 }, (_, i) =>
        new PeakHour({ hour: `${String(i).padStart(2, '0')}:00`, intensity: 0 })
      ),
    });

    const facility = new Facility({
      name:        name,
      sector:      'Blueprint',
      floor:       '1',
      lastUpdated: new Date().toLocaleString(),
      live:        false,
    });

    this.parkingSnapshotSignal.set(new ParkingSnapshot({ facility, stats, rows }));
  }

  // Marca un spot como ocupado en el snapshot en memoria y recalcula las estadísticas.
  // La persistencia (PATCH al blueprint en db.json) la hace el componente que llama,
  // para no crear una dependencia de BlueprintsApi desde este store.
  markSpotOccupied(spotId: string): void {
    const snapshot = this.parkingSnapshotSignal();
    if (!snapshot) return;

    const updatedRows = snapshot.rows.map(row =>
      new ParkingRow({
        id: row.id,
        spots: row.spots.map(spot =>
          spot.id === spotId
            ? new ParkingSpot({ id: spot.id, status: 'occupied' })
            : spot
        ),
      })
    );

    const available = updatedRows
      .flatMap(r => r.spots)
      .filter(s => s.status === 'available').length;

    const total = snapshot.stats.totalSpaces;

    this.parkingSnapshotSignal.set(new ParkingSnapshot({
      facility: snapshot.facility,
      stats: new ParkingStats({
        totalSpaces:           total,
        currentlyAvailable:    available,
        availableTrendPercent: snapshot.stats.availableTrendPercent,
        occupancyRate:         total > 0 ? Math.round(((total - available) / total) * 100) : 0,
        revenueYield:          snapshot.stats.revenueYield,
        revenueTrendPercent:   snapshot.stats.revenueTrendPercent,
        peakHours:             snapshot.stats.peakHours,
      }),
      rows: updatedRows,
    }));
  }

  // Revierte un spot a disponible en el snapshot en memoria y recalcula estadísticas.
  markSpotAvailable(spotId: string): void {
    const snapshot = this.parkingSnapshotSignal();
    if (!snapshot) return;

    const updatedRows = snapshot.rows.map(row =>
      new ParkingRow({
        id: row.id,
        spots: row.spots.map(spot =>
          spot.id === spotId
            ? new ParkingSpot({ id: spot.id, status: 'available' })
            : spot
        ),
      })
    );

    const available = updatedRows
      .flatMap(r => r.spots)
      .filter(s => s.status === 'available').length;

    const total = snapshot.stats.totalSpaces;

    this.parkingSnapshotSignal.set(new ParkingSnapshot({
      facility: snapshot.facility,
      stats: new ParkingStats({
        totalSpaces:           total,
        currentlyAvailable:    available,
        availableTrendPercent: snapshot.stats.availableTrendPercent,
        occupancyRate:         total > 0 ? Math.round(((total - available) / total) * 100) : 0,
        revenueYield:          snapshot.stats.revenueYield,
        revenueTrendPercent:   snapshot.stats.revenueTrendPercent,
        peakHours:             snapshot.stats.peakHours,
      }),
      rows: updatedRows,
    }));
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
        this.errorSignal.set(formatError(err, 'Failed to load analytics'));
        this.analyticsLoadingSignal.set(false);
      },
    });
  }
}
