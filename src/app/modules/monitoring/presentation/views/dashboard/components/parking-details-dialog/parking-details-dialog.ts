import { Component, Inject, OnInit, signal } from '@angular/core';
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

export type DialogStep = 'details' | 'reserve' | 'choose-spot' | 'confirm' | 'success';

interface Spot {
  id: string;
  status: 'available' | 'occupied' | 'selected';
}

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
  protected step = signal<DialogStep>('details');
  
  // Reservation state
  protected selectedDate = signal<Date>(new Date());
  protected startTime = signal<string>('12:00');
  protected duration = signal<number>(2);
  protected selectedSpotId = signal<string | null>(null);
  protected bookingCode = signal<string>('');

  protected spots = signal<Spot[]>([]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public parking: ParkingResource,
    private dialogRef: MatDialogRef<ParkingDetailsDialog>
  ) {}

  ngOnInit(): void {
    this.generateMockSpots();
    this.setDefaultStartTime();
  }

  private setDefaultStartTime(): void {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.startTime.set(`${hours}:${minutes}`);
  }

  private generateMockSpots(): void {
    const mockSpots: Spot[] = [];
    for (let i = 1; i <= 24; i++) {
      const id = `L1-${i}`;
      // Randomly assign occupied status
      const status = Math.random() > 0.3 ? 'available' : 'occupied';
      mockSpots.push({ id, status });
    }
    this.spots.set(mockSpots);
  }

  protected goToReserve(): void {
    this.step.set('reserve');
  }

  protected goToChooseSpot(): void {
    this.step.set('choose-spot');
  }

  protected goToConfirm(): void {
    this.step.set('confirm');
  }

  protected confirmAndPay(): void {
    this.bookingCode.set(`SPG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    this.step.set('success');
  }

  protected selectSpot(spot: Spot): void {
    if (spot.status === 'occupied') return;
    
    this.selectedSpotId.set(spot.id);
    this.spots.update(current => 
      current.map(s => ({
        ...s,
        status: s.id === spot.id ? 'selected' : (s.status === 'selected' ? 'available' : s.status)
      }))
    );
  }

  protected get totalAmount(): number {
    return this.duration() * this.parking.pricePerHour;
  }

  private getLocalDateString(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  protected close(): void {
    if (this.step() === 'success') {
      const reservation: Reservation = {
        id: Math.random().toString(36).substring(7),
        code: this.bookingCode(),
        parkingId: this.parking.id,
        spotId: this.selectedSpotId() || '',
        date: this.getLocalDateString(this.selectedDate()),
        startTime: this.startTime(),
        duration: this.duration(),
        totalAmount: this.totalAmount,
        status: 'completed'
      };
      this.dialogRef.close(reservation);
    } else {
      this.dialogRef.close();
    }
  }

  protected goBack(): void {
    if (this.step() === 'reserve') this.step.set('details');
    else if (this.step() === 'choose-spot') this.step.set('reserve');
    else if (this.step() === 'confirm') this.step.set('choose-spot');
  }
}
