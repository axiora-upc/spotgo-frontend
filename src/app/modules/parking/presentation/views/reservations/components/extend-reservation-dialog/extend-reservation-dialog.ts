import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';

export interface ExtendReservationData {
  reservationId: string;
  parkingName: string;
  currentSpot: string;
  hourlyRate: number;
}

@Component({
  selector: 'app-extend-reservation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    TranslateModule,
  ],
  templateUrl: './extend-reservation-dialog.html',
  styleUrl: './extend-reservation-dialog.css',
})
export class ExtendReservationDialog {
  protected readonly additionalHours = signal<number>(1);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ExtendReservationData,
    private readonly dialogRef: MatDialogRef<ExtendReservationDialog>
  ) {}

  protected get additionalCost(): number {
    const hours = this.additionalHours();
    return hours > 0 ? hours * this.data.hourlyRate : 0;
  }

  protected confirm(): void {
    if (this.additionalHours() >= 1) {
      this.dialogRef.close(this.additionalHours());
    }
  }

  protected cancel(): void {
    this.dialogRef.close(null);
  }
}
