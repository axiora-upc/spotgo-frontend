import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { MonitoringStore } from '../../../../monitoring/application/monitoring.store';
import { Reservation } from '../../../../monitoring/domain/model/reservation.entity';
import { BlueprintsApi } from '../../../../profiles/infrastructure/blueprints-api';
import { ExtendReservationDialog, ExtendReservationData } from './components/extend-reservation-dialog/extend-reservation-dialog';

interface ReservationViewModel extends Reservation {
  parkingName: string;
  remainingTimeMs: number;
  remainingTimeStr: string;
  isExpiringSoon: boolean;
  isActive: boolean;   // reserva en curso ahora mismo
  isUpcoming: boolean; // aún no ha empezado
  endTimeStr: string;
}

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    TranslateModule,
  ],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css',
})
export class ReservationsComponent implements OnInit, OnDestroy {
  private readonly store         = inject(MonitoringStore);
  private readonly dialog        = inject(MatDialog);
  private readonly router        = inject(Router);
  private readonly blueprintsApi = inject(BlueprintsApi);

  private timerIntervalId: any;
  protected currentTime = signal<number>(Date.now());

  protected readonly reservations = computed<ReservationViewModel[]>(() => {
    const rawReservations = this.store.userReservations();
    const parkings = this.store.parkings();
    const now = this.currentTime();

    return rawReservations
      .filter(r => r.status !== 'cancelled')
      .map((res) => {
        const parking = parkings.find((p) => p.id === res.parkingId);
        const parkingName = parking ? parking.name : 'Parking Lot';

        const [year, month, day] = res.date.split('-').map(Number);
        const [hours, minutes]   = res.startTime.split(':').map(Number);
        const startDateTime = new Date(year, month - 1, day, hours, minutes);
        const endDateTime   = new Date(startDateTime.getTime() + res.duration * 60 * 60 * 1000);

        const isActive   = now >= startDateTime.getTime() && now < endDateTime.getTime();
        const isUpcoming = now < startDateTime.getTime();

        const timeUntilEnd   = Math.max(0, endDateTime.getTime() - now);
        const timeUntilStart = Math.max(0, startDateTime.getTime() - now);

        const endHour = endDateTime.getHours().toString().padStart(2, '0');
        const endMin  = endDateTime.getMinutes().toString().padStart(2, '0');

        return {
          ...res,
          parkingName,
          remainingTimeMs:  isActive ? timeUntilEnd : timeUntilStart,
          remainingTimeStr: isActive
            ? this.formatCountdown(timeUntilEnd)
            : this.formatTimeUntilStart(timeUntilStart),
          isExpiringSoon: isActive && timeUntilEnd < 2 * 60 * 60 * 1000,
          isActive,
          isUpcoming,
          endTimeStr: `${endHour}:${endMin}`,
        };
      });
  });

  protected readonly expiringSoonReservation = computed(() =>
    this.reservations().find(r => r.isExpiringSoon && r.remainingTimeMs > 0)
  );

  ngOnInit(): void {
    this.store.loadParkings();
    this.store.loadUserReservations();

    this.timerIntervalId = setInterval(() => {
      this.currentTime.set(Date.now());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);
  }

  protected extendTime(reservation: ReservationViewModel): void {
    const matched = this.store.parkings().find(p => p.id === reservation.parkingId);
    const rate = matched ? matched.pricePerHour : 2.50;

    const dialogRef = this.dialog.open(ExtendReservationDialog, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        reservationId: reservation.id,
        parkingName: reservation.parkingName,
        currentSpot: reservation.spotId,
        hourlyRate: rate,
      } as ExtendReservationData,
    });

    dialogRef.afterClosed().subscribe((addedHours: number | null) => {
      if (addedHours && addedHours >= 1) {
        const raw = this.store.userReservations();
        const found = raw.find(r => r.id === reservation.id);
        if (found) {
          this.store.updateReservation({
            ...found,
            duration:    found.duration + addedHours,
            totalAmount: found.totalAmount + (addedHours * rate),
          });
        }
      }
    });
  }

  protected navigateToParking(): void {
    this.router.navigate(['/dashboard']);
  }

  protected cancelReservation(reservation: ReservationViewModel): void {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    this.store.cancelReservation(reservation, {
      onSuccess: () => {
        this.blueprintsApi.getBlueprintByParkingId(reservation.parkingId).subscribe(bp => {
          if (!bp) return;
          const releasedSpots = bp.spots.map(s => {
            const sId = `${String.fromCharCode(65 + s.row)}${s.col + 1}`;
            return sId === reservation.spotId ? { ...s, status: 'available' as const } : s;
          });
          const avail = releasedSpots.filter(s => (s.status ?? 'available') === 'available').length;
          this.blueprintsApi.patchBlueprintSpots(bp.id, releasedSpots).subscribe();
          this.blueprintsApi.updateParkingStats(reservation.parkingId, {
            totalSpaces: bp.spots.length, availableSpaces: avail, totalFloors: 1,
          }).subscribe();
          this.store.markSpotAvailable(reservation.spotId);
          this.store.updateParkingAvailableSpaces(reservation.parkingId, avail);
        });
      },
    });
  }

  // Formato HH:MM:SS para reservas activas (countdown hasta el fin)
  private formatCountdown(ms: number): string {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hrs  = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  }

  // Formato legible "en Xd Xh" para reservas próximas (countdown hasta el inicio)
  private formatTimeUntilStart(ms: number): string {
    if (ms <= 0) return 'Ahora';
    const totalMins = Math.floor(ms / 60000);
    const days = Math.floor(totalMins / (60 * 24));
    const hrs  = Math.floor((totalMins % (60 * 24)) / 60);
    const mins = totalMins % 60;

    if (days > 0) return `en ${days}d ${hrs}h`;
    if (hrs > 0)  return `en ${hrs}h ${mins}m`;
    return `en ${mins}m`;
  }
}
