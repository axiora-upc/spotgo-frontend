import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { environment } from '../../../../../../../environments/environment';
import { MonitoringStore } from '../../../../application/monitoring.store';
import { MonitoringApi } from '../../../../infrastructure/monitoring-api';
import { BlueprintsApi } from '../../../../../../modules/profiles/infrastructure/blueprints-api';
import { HistoryApi } from '../../../../../../modules/parking/infrastructure/history-api';
import { CurrentUserService } from '../../../../../../shared/services/current-user.service';
import { Blueprint } from '../../../../../../modules/profiles/domain/model/blueprint.entity';
import { DetectedSpot } from '../../../../../../modules/profiles/domain/model/detected-spot.entity';
import { ParkingSpot, PeakHour } from '../../../../domain/model/parking-spot.entity';
import { ReservationRaw } from '../../../../../../modules/parking/domain/model/reservation-raw.entity';

interface ClientResource {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}


interface VehicleResource {
  id: string;
  clientId: string;
  licensePlate?: string;
  vehicleType?: string;
  brand?: string;
  model?: string;
}

interface SpotReservationView {
  code: string;
  clientId: string;
  clientName: string;
  email: string;
  phone: string;
  vehicle: string;
  licensePlate: string;
  start: string;
  end: string;
  amount: number;
}

interface SelectedSpotView {
  spot: ParkingSpot;
  reservation: SpotReservationView | null;
}

@Component({
  selector: 'app-realtime-map-overview',
  imports: [CurrencyPipe, DecimalPipe, NgClass, RouterLink, MatIcon, TranslatePipe],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview implements OnInit, OnDestroy {
  protected readonly store        = inject(MonitoringStore);
  private  readonly monitoringApi = inject(MonitoringApi);
  private  readonly blueprintsApi = inject(BlueprintsApi);
  private  readonly historyApi    = inject(HistoryApi);
  private  readonly currentUser   = inject(CurrentUserService);
  private  readonly http          = inject(HttpClient);

  protected readonly refreshing = signal(false);
  protected readonly selectedSpot = signal<SelectedSpotView | null>(null);

  private activeBlueprint: Blueprint | null = null;
  private activeParkingName = '';
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private activeReservations: ReservationRaw[] = [];
  private clients: ClientResource[] = [];
  private vehicles: VehicleResource[] = [];

  ngOnInit(): void {
    this.loadForCurrentParking();
    // Poll every 10 s so spot availability updates without manual refresh
    this.pollingInterval = setInterval(() => this.loadForCurrentParking(), 10_000);
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  private loadForCurrentParking(): void {
    // Do NOT clear the snapshot before re-fetching — keep stale data visible
    // while the request is in flight so there is no visual flash.
    // clearParkingSnapshot() is only called when no blueprint is found.
    const parkingId = this.currentUser.parkingId;

    forkJoin({
      blueprint: this.blueprintsApi.getBlueprintByParkingId(parkingId),
      parkings:  this.monitoringApi.getParkings(),
    }).subscribe({
      next: ({ blueprint: bp, parkings }) => {
        if (!bp?.spots?.length) {
          this.store.clearParkingSnapshot(); // no blueprint → show empty state
          return;
        }
        this.activeBlueprint = bp;

        // Use the real parking name from the DB, fall back to blueprint name
        const parking = parkings.find(p => p.id === parkingId);
        this.activeParkingName = parking?.name ?? bp.name;

        this.loadSnapshotWithCleanup(bp.id, bp.spots, this.activeParkingName, parkingId);
      },
    });
  }

  private loadSnapshotWithCleanup(blueprintId: string, spots: DetectedSpot[], name: string, parkingId: string): void {
    forkJoin({
      reservations: this.historyApi.getReservations(),
      allUsers:     this.http.get<ClientResource[]>(`${environment.apiUrl}/users`),
      userRoles:    this.http.get<{ userId: string; roleId: string }[]>(`${environment.apiUrl}/userRoles`),
      vehicles:     this.http.get<VehicleResource[]>(`${environment.apiUrl}/vehicles`),
    }).subscribe({
      next: ({ reservations, allUsers, userRoles, vehicles }) => {
        const now = Date.now();
        const clientIds = new Set(
          userRoles.filter(ur => ur.roleId === 'rol-002').map(ur => ur.userId)
        );
        this.clients  = allUsers.filter(u => clientIds.has(u.id));
        this.vehicles = vehicles;

        // Ingresos del parking: suma de baseAmount (precio completo sin descuento)
        const revenue = Math.round(
          reservations
            .filter(r => r.parkingId === parkingId && r.status !== 'cancelled')
            .reduce((sum, r) => sum + r.baseAmount, 0) * 100
        ) / 100;

        // Peak hours: agrupa reservas no-canceladas por slot de 2h (06-22)
        const SLOTS = Array.from({ length: 24 }, (_, i) => i);
        const hourCounts = new Map<number, number>();
        reservations
          .filter(r => r.parkingId === parkingId && r.status !== 'cancelled')
          .forEach(r => {
            const hour = new Date(r.startDate).getHours();
            const nearest = SLOTS.reduce((prev, curr) =>
              Math.abs(curr - hour) < Math.abs(prev - hour) ? curr : prev
            );
            hourCounts.set(nearest, (hourCounts.get(nearest) ?? 0) + 1);
          });
        const maxCount = Math.max(1, ...Array.from(hourCounts.values()));
        const computedPeakHours = SLOTS.map(h =>
          new PeakHour({
            hour:      `${String(h).padStart(2, '0')}:00`,
            intensity: (hourCounts.get(h) ?? 0) / maxCount,
          })
        );

        // Reservas activas que aún NO han vencido → esos spots siguen legítimamente ocupados
        this.activeReservations = reservations.filter(
          r => r.parkingId === parkingId && r.status === 'active' && new Date(r.endDate).getTime() > now
        );
        const validActiveSpots = new Set(
          this.activeReservations.map(r => r.spot)
        );

        // Reservas activas vencidas → marcar como 'completed'
        const expiredActive = reservations.filter(
          r => r.parkingId === parkingId && r.status === 'active' && new Date(r.endDate).getTime() <= now
        );

        // Spots ocupados sin reserva activa vigente (expirados u huérfanos sin reserva)
        const spotIdsToFree = new Set<string>();
        spots.forEach(s => {
          if ((s.status ?? 'available') !== 'occupied') return;
          const sId = `${String.fromCharCode(65 + s.row)}${s.col + 1}`;
          if (!validActiveSpots.has(sId)) spotIdsToFree.add(sId);
        });

        if (spotIdsToFree.size === 0 && expiredActive.length === 0) {
          this.store.loadBlueprintSnapshot(spots, name, revenue, computedPeakHours);
          return;
        }

        const fixedSpots = spots.map(s => {
          const sId = `${String.fromCharCode(65 + s.row)}${s.col + 1}`;
          return spotIdsToFree.has(sId) ? { ...s, status: 'available' as const } : s;
        });

        this.blueprintsApi.patchBlueprintSpots(blueprintId, fixedSpots).subscribe();

        const avail = fixedSpots.filter(s => (s.status ?? 'available') === 'available').length;
        this.blueprintsApi.updateParkingStats(parkingId, {
          totalSpaces: fixedSpots.length, availableSpaces: avail, totalFloors: 1,
        }).subscribe();

        expiredActive.forEach(r => this.historyApi.setReservationStatus(r.id, 'completed').subscribe());

        this.store.loadBlueprintSnapshot(fixedSpots, name, revenue, computedPeakHours);
      },
      error: () => this.store.loadBlueprintSnapshot(spots, name),
    });
  }

  protected spotGridCol(id: string): string {
    const match = id.match(/^[A-Z]([1-9]|10)$/);
    return match ? match[1] : 'auto';
  }

  protected openSpotDetails(spot: ParkingSpot): void {
    const reservation = this.activeReservations.find(r => r.spot === spot.id);
    this.selectedSpot.set({
      spot,
      reservation: reservation ? this.toSpotReservationView(reservation) : null,
    });
  }

  protected closeSpotDetails(): void {
    this.selectedSpot.set(null);
  }

  protected setSelectedSpotMaintenance(): void {
    const selected = this.selectedSpot();
    if (!selected || selected.reservation) return;
    this.updateSelectedSpotStatus('maintenance');
  }

  protected setSelectedSpotAvailable(): void {
    const selected = this.selectedSpot();
    if (!selected || selected.reservation) return;
    this.updateSelectedSpotStatus('available');
  }

  protected refresh(): void {
    if (this.refreshing()) return;
    this.refreshing.set(true);

    if (this.activeBlueprint?.spots) {
      this.loadSnapshotWithCleanup(
        this.activeBlueprint.id,
        this.activeBlueprint.spots,
        this.activeParkingName,
        this.activeBlueprint.parkingId,
      );
      this.refreshing.set(false);
    } else {
      this.store.refreshParkingSnapshot({
        onSuccess: () => this.refreshing.set(false),
        onError:   () => this.refreshing.set(false),
      });
    }
  }

  private updateSelectedSpotStatus(status: 'available' | 'maintenance'): void {
    const selected = this.selectedSpot();
    if (!selected || !this.activeBlueprint) return;

    const spotId = selected.spot.id;
    const updatedSpots = this.activeBlueprint.spots.map(s => {
      const sId = `${String.fromCharCode(65 + s.row)}${s.col + 1}`;
      return sId === spotId ? { ...s, status } : s;
    });

    this.activeBlueprint.spots = updatedSpots;
    this.blueprintsApi.patchBlueprintSpots(this.activeBlueprint.id, updatedSpots).subscribe();

    const availableCount = updatedSpots.filter(s => (s.status ?? 'available') === 'available').length;
    this.blueprintsApi.updateParkingStats(this.activeBlueprint.parkingId, {
      totalSpaces: updatedSpots.length,
      availableSpaces: availableCount,
      totalFloors: 1,
    }).subscribe();
    this.store.updateParkingAvailableSpaces(this.activeBlueprint.parkingId, availableCount);
    this.store.loadBlueprintSnapshot(updatedSpots, this.activeParkingName);
    this.selectedSpot.set({
      spot: new ParkingSpot({ id: spotId, status }),
      reservation: null,
    });
  }

  private toSpotReservationView(reservation: ReservationRaw): SpotReservationView {
    const client  = this.clients.find(c => c.id === reservation.clientId);
    const vehicle = this.vehicles.find(v => v.clientId === reservation.clientId);
    return {
      code: reservation.code,
      clientId: reservation.clientId,
      clientName: client ? `${client.firstName} ${client.lastName}` : reservation.clientId,
      email: client?.email ?? '-',
      phone: client?.phone ?? '-',
      vehicle: [vehicle?.brand, vehicle?.model, vehicle?.vehicleType].filter(Boolean).join(' - ') || '-',
      licensePlate: vehicle?.licensePlate ?? '-',
      start: this.formatDateTime(reservation.startDate),
      end: this.formatDateTime(reservation.endDate),
      amount: reservation.amount,
    };
  }

  protected exportLogs(): void {
    const snapshot = this.store.parkingSnapshot();
    if (!snapshot) return;

    const lines: string[] = [
      `SpotGo — Spot Status Report`,
      `Parking: ${snapshot.facility.name}`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `SPOT      STATUS`,
      `─`.repeat(22),
    ];

    snapshot.rows.forEach(row => {
      row.spots
        .filter(s => s.status !== 'empty')
        .forEach(s => lines.push(`${s.id.padEnd(10)}${s.status.toUpperCase()}`));
    });

    lines.push(``, `End of report.`);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `spotgo-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}
