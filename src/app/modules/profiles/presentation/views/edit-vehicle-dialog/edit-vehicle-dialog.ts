import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { VehicleResource, VehiclesApi } from '../../../infrastructure/vehicles-api';

@Component({
  selector: 'app-edit-vehicle-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatIcon, TranslatePipe],
  templateUrl: './edit-vehicle-dialog.html',
  styleUrl: './edit-vehicle-dialog.css',
})
export class EditVehicleDialog {
  private readonly vehiclesApi = inject(VehiclesApi);
  private readonly dialogRef = inject(MatDialogRef<EditVehicleDialog>);

  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly success = signal(false);
  protected readonly vehicle = signal<VehicleResource | null>(null);

  protected readonly form = new FormGroup({
    licensePlate: new FormControl('', [Validators.required]),
    vehicleType: new FormControl('', [Validators.required]),
    brand: new FormControl('', [Validators.required]),
    model: new FormControl('', [Validators.required]),
  });

  constructor() {
    this.loadVehicle();
  }

  protected getError(field: 'licensePlate' | 'vehicleType' | 'brand' | 'model'): string | null {
    const control = this.form.get(field);
    if (!control || !control.touched || control.valid) return null;
    if (control.hasError('required')) return 'iam.errors.required';
    return null;
  }

  protected onSubmit(): void {
    const vehicle = this.vehicle();
    if (!vehicle) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.serverError.set(null);
    this.submitting.set(true);

    const value = this.form.getRawValue();
    this.vehiclesApi.updateVehicle(vehicle.id, {
      licensePlate: value.licensePlate!.trim(),
      vehicleType: value.vehicleType!.trim(),
      brand: value.brand!.trim(),
      model: value.model!.trim(),
    }).subscribe({
      next: (updated) => {
        this.vehicle.set(updated);
        this.form.patchValue(updated);
        this.submitting.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        this.serverError.set(err instanceof Error && err.message ? err.message : 'profiles.vehicle.errors.save');
      },
    });
  }

  protected close(): void {
    this.dialogRef.close(this.vehicle());
  }

  private loadVehicle(): void {
    this.vehiclesApi.getCurrentClientVehicle().subscribe({
      next: (vehicle) => {
        this.vehicle.set(vehicle);
        if (vehicle) this.form.patchValue(vehicle);
        this.loading.set(false);
      },
      error: (err) => {
        this.serverError.set(err instanceof Error && err.message ? err.message : 'profiles.vehicle.errors.load');
        this.loading.set(false);
      },
    });
  }
}
