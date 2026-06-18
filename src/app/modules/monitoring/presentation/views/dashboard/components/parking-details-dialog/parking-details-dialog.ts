import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { ParkingResource } from '../../../../../infrastructure/monitoring-api';
import { Reservation } from '../../../../../domain/model/reservation.entity';
import { BlueprintsApi } from '../../../../../../../modules/profiles/infrastructure/blueprints-api';
import { MonitoringStore } from '../../../../../application/monitoring.store';
import { DetectedSpot } from '../../../../../../../modules/profiles/domain/model/detected-spot.entity';
import { HistoryApi } from '../../../../../../../modules/parking/infrastructure/history-api';
import { FavoritesStore } from '../../../../../../../modules/profiles/application/favorites.store';
import { CurrentUserService } from '../../../../../../../shared/services/current-user.service';
import { PaymentStore } from '../../../../../../../modules/payment/application/payment.store';

export type DialogStep = 'details' | 'reserve' | 'choose-spot' | 'confirm' | 'success';

interface Spot {
  id: string;
  status: 'available' | 'occupied' | 'maintenance' | 'selected' | 'empty';
}

const GRID_COLS = 8;

@Component({
  selector: 'app-parking-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    TranslateModule
  ],
  templateUrl: './parking-details-dialog.html',
  styleUrl: './parking-details-dialog.css'
})
export class ParkingDetailsDialog implements OnInit {
  private readonly api            = inject(BlueprintsApi);
  private readonly store          = inject(MonitoringStore);
  private readonly historyApi     = inject(HistoryApi);
  private readonly paymentStore   = inject(PaymentStore);
  protected readonly favStore     = inject(FavoritesStore);
  private readonly currentUser    = inject(CurrentUserService);

  protected step = signal<DialogStep>('details');

  // Propiedades de formulario como valores planos (NO signals) para que
  // [(ngModel)] las lea y escriba directamente sin romper la reactividad.
  protected selectedDate    = new Date();
  protected startTime       = '12:00';
  protected durationHours   = 1;
  protected durationMinutes = 30;

  protected selectedSpotId = signal<string | null>(null);
  protected bookingCode    = signal<string>('');
  protected spots          = signal<Spot[]>([]);

  private blueprintId    = '';
  private blueprintSpots: DetectedSpot[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public parking: ParkingResource,
    private dialogRef: MatDialogRef<ParkingDetailsDialog>
  ) {}

  ngOnInit(): void {
    this.setDefaultStartTime();
    this.favStore.loadFavoritesOnce(this.currentUser.clientId);
    if (!this.paymentStore.subscription()) {
      this.paymentStore.loadSubscriptionByClientId(this.currentUser.clientId);
    }
    if (this.paymentStore.plans().length === 0) {
      this.paymentStore.loadPlans();
    }
    this.api.getBlueprintByParkingId(this.parking.id).subscribe(bp => {
      if (bp?.spots?.length) {
        this.blueprintId    = bp.id;
        this.blueprintSpots = bp.spots;
        this.buildSpotsFromBlueprint(bp.spots);
      } else {
        this.generateMockSpots();
      }
    });
  }

  protected get isFavorite(): boolean {
    return this.favStore.isFavorite(this.parking.id);
  }

  protected toggleFavorite(): void {
    if (this.isFavorite) {
      const fav = this.favStore.favorites().find(f => f.parkingId === this.parking.id);
      if (fav) this.favStore.removeFavorite(fav.id);
    } else {
      this.favStore.addFavorite(this.currentUser.clientId, this.parking.id);
    }
  }

  private setDefaultStartTime(): void {
    const now     = new Date();
    const hours   = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.startTime = `${hours}:${minutes}`;
  }

  private buildSpotsFromBlueprint(detectedSpots: DetectedSpot[]): void {
    const rowMap = new Map<number, Map<number, DetectedSpot>>();
    for (const s of detectedSpots) {
      if (!rowMap.has(s.row)) rowMap.set(s.row, new Map());
      rowMap.get(s.row)!.set(s.col, s);
    }

    const result: Spot[] = [];
    for (const rowKey of [...rowMap.keys()].sort((a, b) => a - b)) {
      const rowLabel = String.fromCharCode(65 + rowKey);
      const colMap   = rowMap.get(rowKey)!;
      for (let col = 0; col < GRID_COLS; col++) {
        const detected = colMap.get(col);
        result.push({
          id:     `${rowLabel}${col + 1}`,
          status: detected
            ? ((detected.status ?? 'available') as 'available' | 'occupied' | 'maintenance')
            : 'empty',
        });
      }
    }
    this.spots.set(result);
  }

  private generateMockSpots(): void {
    const mockSpots: Spot[] = [];
    for (let i = 1; i <= 24; i++) {
      mockSpots.push({
        id:     `L1-${i}`,
        status: Math.random() > 0.3 ? 'available' : 'occupied',
      });
    }
    this.spots.set(mockSpots);
  }

  protected get visibleSpots(): Spot[] {
    return this.spots().filter(s => s.status !== 'empty');
  }

  protected goToReserve(): void    { this.step.set('reserve'); }
  protected goToChooseSpot(): void { this.step.set('choose-spot'); }
  protected goToConfirm(): void    { this.step.set('confirm'); }

  protected confirmAndPay(): void {
    const code    = `SPG-${crypto.randomUUID().substring(0, 6).toUpperCase()}`;
    const spotId  = this.selectedSpotId() || '';
    const date    = this.getLocalDateString(this.selectedDate);
    const duration = this.totalDurationHours;
    const originalAmount = this.totalAmount;
    const amount  = this.discountedAmount;
    const savings = Math.round((originalAmount - amount) * 100) / 100;

    this.bookingCode.set(code);

    // 1. Guardar la reserva en la BD INMEDIATAMENTE (no esperar al "Done")
    const reservation: Reservation = {
      id:          crypto.randomUUID(),
      code,
      parkingId:   this.parking.id,
      spotId,
      date,
      startTime:   this.startTime,
      duration,
      totalAmount: amount,
      baseAmount:  originalAmount,
      status:      'completed',
    };
    this.store.completeReservation(reservation);

    if (savings > 0) {
      this.paymentStore.addToSavedThisMonth(savings);
    }

    // 2. Marcar el spot como ocupado en el blueprint
    if (spotId && this.blueprintId) {
      const updatedSpots = this.blueprintSpots.map(s => {
        const sId = `${String.fromCharCode(65 + s.row)}${s.col + 1}`;
        return sId === spotId ? { ...s, status: 'occupied' as const } : s;
      });

      this.api.patchBlueprintSpots(this.blueprintId, updatedSpots).subscribe();
      this.store.markSpotOccupied(spotId);

      const availableCount = updatedSpots.filter(s => (s.status ?? 'available') === 'available').length;
      this.api.updateParkingStats(this.parking.id, {
        totalSpaces:     this.blueprintSpots.length,
        availableSpaces: availableCount,
        totalFloors:     1,
      }).subscribe();
      // Update in-memory signal so the dashboard bubble reflects the new count immediately
      this.store.updateParkingAvailableSpaces(this.parking.id, availableCount);

      // 3. Auto-liberar el spot y cerrar la reserva cuando expire
      const capturedSpotId       = spotId;
      const capturedParkingId    = this.parking.id;
      const capturedReservationId = reservation.id;
      const durationMs = duration * 60 * 60 * 1000;

      setTimeout(() => {
        this.historyApi.setReservationStatus(capturedReservationId, 'completed').subscribe();
        this.api.getBlueprintByParkingId(capturedParkingId).subscribe(bp => {
          if (!bp) return;
          const releasedSpots = bp.spots.map(s => {
            const sId = `${String.fromCharCode(65 + s.row)}${s.col + 1}`;
            return sId === capturedSpotId ? { ...s, status: 'available' as const } : s;
          });
          this.api.patchBlueprintSpots(bp.id, releasedSpots).subscribe();
          this.store.markSpotAvailable(capturedSpotId);
          const avail = releasedSpots.filter(s => (s.status ?? 'available') === 'available').length;
          this.api.updateParkingStats(capturedParkingId, {
            totalSpaces:     bp.spots.length,
            availableSpaces: avail,
            totalFloors:     1,
          }).subscribe();
        });
      }, durationMs);
    }

    this.step.set('success');
  }

  protected selectSpot(spot: Spot): void {
    if (spot.status === 'occupied' || spot.status === 'maintenance' || spot.status === 'empty') return;

    this.selectedSpotId.set(spot.id);
    this.spots.update(current =>
      current.map(s => ({
        ...s,
        status: s.id === spot.id
          ? 'selected'
          : (s.status === 'selected' ? 'available' : s.status),
      }))
    );
  }

  // Duración total en horas (decimal). Ejemplo: 1h 30min → 1.5
  protected get totalDurationHours(): number {
    return this.durationHours + this.durationMinutes / 60;
  }

  protected get totalAmount(): number {
    return Math.round(this.totalDurationHours * this.parking.pricePerHour * 100) / 100;
  }

  protected get discountPercent(): number {
    return this.paymentStore.currentDiscount();
  }

  protected get discountedAmount(): number {
    if (this.discountPercent <= 0) return this.totalAmount;
    return Math.round(this.totalAmount * (1 - this.discountPercent / 100) * 100) / 100;
  }

  private getLocalDateString(d: Date): string {
    const y   = d.getFullYear();
    const m   = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  protected close(): void {
    this.dialogRef.close();
  }

  protected goBack(): void {
    if      (this.step() === 'reserve')      this.step.set('details');
    else if (this.step() === 'choose-spot')  this.step.set('reserve');
    else if (this.step() === 'confirm')      this.step.set('choose-spot');
  }
}
