import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { MonitoringStore } from '../../../../monitoring/application/monitoring.store';
import { Reservation } from '../../../../monitoring/domain/model/reservation.entity';
import { ExtendReservationDialog, ExtendReservationData } from './components/extend-reservation-dialog/extend-reservation-dialog';

interface ReservationViewModel extends Reservation {
  parkingName: string;
  remainingTimeMs: number;
  remainingTimeStr: string;
  isExpiringSoon: boolean; // less than 2 hours
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
  private readonly store = inject(MonitoringStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  private timerIntervalId: any;
  protected currentTime = signal<number>(Date.now());

  // Mapped reservations including logic fields
  protected readonly reservations = computed<ReservationViewModel[]>(() => {
    const rawReservations = this.store.userReservations();
    const parkings = this.store.parkings();
    const now = this.currentTime();

    return rawReservations
      .filter(r => r.status !== 'cancelled')
      .map((res) => {
        const parking = parkings.find((p) => p.id === res.parkingId);
        const parkingName = parking ? parking.name : 'Parking Lot';

        // Calculate real countdown using robust local Date constructors to avoid parsing/timezone quirks
        const [year, month, day] = res.date.split('-').map(Number);
        const [hours, minutes] = res.startTime.split(':').map(Number);
        const startDateTime = new Date(year, month - 1, day, hours, minutes);
        const endDateTime = new Date(startDateTime.getTime() + res.duration * 60 * 60 * 1000);
        
        const remainingMs = Math.max(0, endDateTime.getTime() - now);
        const isExpiringSoon = remainingMs > 0 && remainingMs < 2 * 60 * 60 * 1000; // less than 2 hours

        // Format end time
        const endHour = endDateTime.getHours().toString().padStart(2, '0');
        const endMin = endDateTime.getMinutes().toString().padStart(2, '0');
        const endTimeStr = `${endHour}:${endMin}`;

        return {
          ...res,
          parkingName,
          remainingTimeMs: remainingMs,
          remainingTimeStr: this.formatRemainingTime(remainingMs),
          isExpiringSoon: res.status === 'completed' && isExpiringSoon, // Active only
          endTimeStr,
        };
      });
  });

  // The most critical reservation that triggers the warning banner
  protected readonly expiringSoonReservation = computed(() => {
    return this.reservations().find((r) => r.isExpiringSoon && r.remainingTimeMs > 0);
  });

  ngOnInit(): void {
    this.store.loadParkings();

    // Start countdown timer ticker
    this.timerIntervalId = setInterval(() => {
      this.currentTime.set(Date.now());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
    }
  }

  protected extendTime(reservation: ReservationViewModel): void {
    const dialogRef = this.dialog.open(ExtendReservationDialog, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        reservationId: reservation.id,
        parkingName: reservation.parkingName,
        currentSpot: reservation.spotId,
        hourlyRate: 2.50, // Mock hourly rate
      } as ExtendReservationData,
    });

    dialogRef.afterClosed().subscribe((addedHours: number | null) => {
      if (addedHours && addedHours >= 1) {
        // Access signal to update reservation
        const rawReservations = this.store.userReservations();
        const index = rawReservations.findIndex(r => r.id === reservation.id);
        
        if (index !== -1) {
          const resToUpdate = rawReservations[index];
          const updatedReservation = {
            ...resToUpdate,
            duration: resToUpdate.duration + addedHours,
            totalAmount: resToUpdate.totalAmount + (addedHours * 2.50),
          };
          
          // Mutate store's internal list of userReservations. 
          // Since completeReservation adds to the list, we can't update directly unless store provides update,
          // but we can work around it by modifying the local storage/signal reference if we want, 
          // OR we can patch it on the component level.
          // Since MonitoringStore doesn't have an 'updateReservation' method, let's update through a mock update.
          // Wait! Let's add an `updateReservation` to MonitoringStore or just overwrite using completeReservation?
          // No, `completeReservation` appends. Let's edit MonitoringStore to support updating/cancelling, which is clean architecture!
          // Let's do it! (I will edit MonitoringStore directly right after this)
          this.store.updateReservation(updatedReservation);
        }
      }
    });
  }

  protected navigateToParking(): void {
    // Navigate to real-time map / dashboard
    this.router.navigate(['/monitoring/dashboard']);
  }

  protected cancelReservation(reservation: ReservationViewModel): void {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      const updatedReservation: Reservation = {
        ...reservation,
        status: 'cancelled',
      };
      this.store.updateReservation(updatedReservation);
    }
  }

  private formatRemainingTime(ms: number): string {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  }
}
