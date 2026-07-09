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
import { FavoritesStore } from '../../../../../../../modules/profiles/application/favorites.store';
import { CurrentUserService } from '../../../../../../../shared/services/current-user.service';
import { PaymentStore } from '../../../../../../../modules/payment/application/payment.store';
import { TranslateService } from '@ngx-translate/core';

export type DialogStep = 'details' | 'reserve' | 'choose-spot' | 'confirm' | 'success';

interface Spot {
  id: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'selected' | 'empty';
  assignedEmployeeName?: string | null;
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
  private readonly paymentStore   = inject(PaymentStore);
  private readonly translate      = inject(TranslateService);
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
  protected readonly blockedSpotMessage = signal<string | null>(null);

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
            ? ((detected.status ?? 'available') as 'available' | 'occupied' | 'reserved' | 'maintenance')
            : 'empty',
          assignedEmployeeName: detected?.assignedEmployeeName ?? null,
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

    this.bookingCode.set(code);

    // Persist the reservation first so local state reflects the backend result.
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
      status:      'active',
    };
    this.store.completeReservation(reservation, {
      onSuccess: () => {
        this.store.loadParkings();
        this.step.set('success');
      },
    });
  }

  protected selectSpot(spot: Spot): void {
    if (spot.status === 'reserved') {
      this.blockedSpotMessage.set(this.translate.instant(
        'dashboard.reservation.reserved-by-employee',
        { employeeName: spot.assignedEmployeeName ?? this.translate.instant('dashboard.reservation.an-employee') }
      ));
      return;
    }
    if (spot.status === 'occupied' || spot.status === 'maintenance' || spot.status === 'empty') return;

    this.blockedSpotMessage.set(null);
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

  protected get occupiedSpaces(): number {
    if (this.parking.totalSpaces > 0) {
      return Math.max(0, this.parking.totalSpaces - this.parking.availableSpaces);
    }
    return this.blueprintSpots.filter(s => (s.status ?? 'available') === 'occupied').length;
  }

  protected get effectiveTotalSpaces(): number {
    if (this.parking.totalSpaces > 0) return this.parking.totalSpaces;
    if (this.blueprintSpots.length > 0) return this.blueprintSpots.length;
    return this.parking.availableSpaces;
  }

  protected get occupancyPercent(): number {
    return this.effectiveTotalSpaces > 0 ? this.occupiedSpaces / this.effectiveTotalSpaces * 100 : 0;
  }

  protected goBack(): void {
    if      (this.step() === 'reserve')      this.step.set('details');
    else if (this.step() === 'choose-spot')  this.step.set('reserve');
    else if (this.step() === 'confirm')      this.step.set('choose-spot');
  }
}
