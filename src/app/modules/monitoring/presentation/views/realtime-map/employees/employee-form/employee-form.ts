/*
  EmployeeForm is the Angular Material dialog used to create or edit
  an Employee.

  It is opened from the Employees view via MatDialog.open() with:
  - mode: 'create' | 'edit'
  - employee?: Employee (only required in edit mode)

  On Save the dialog closes with a new Employee instance as the
  result. The caller (Employees view) forwards that entity to the
  MonitoringStore, which persists it through MonitoringApi.

  Cancel closes with no result.
*/
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import {
  Employee,
  EmployeeRole,
  EmployeeSchedule,
  EmployeeStatus,
} from '../../../../../domain/model/employee.entity';

/*
  Dialog data shape consumed by the form. Create mode does not need
  an employee; edit mode requires one so the form can be hydrated
  with its values.
*/
export interface EmployeeFormData {
  mode: 'create' | 'edit';
  employee?: Employee;
  spotOptions: string[];
}

@Component({
  selector: 'app-employee-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIcon,
    TranslatePipe,
  ],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.css',
})
export class EmployeeForm {
  private readonly dialogRef = inject(MatDialogRef<EmployeeForm, Employee>);
  protected readonly data = inject<EmployeeFormData>(MAT_DIALOG_DATA);

  protected readonly roles: EmployeeRole[] = ['guard', 'cleaning-personnel'];
  protected readonly schedules: EmployeeSchedule[] = ['all-week', 'weekdays', 'weekends'];
  protected readonly statuses: EmployeeStatus[] = ['on-duty', 'off-duty'];
  protected readonly spotOptions = this.data.spotOptions;

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.employee?.name ?? '', [Validators.required]],
    role: [this.data.employee?.role ?? ('guard' as EmployeeRole), [Validators.required]],
    schedule: [
      this.data.employee?.schedule ?? ('all-week' as EmployeeSchedule),
      [Validators.required],
    ],
    shiftStart: [this.data.employee?.shiftStart ?? '09:00', [Validators.required]],
    shiftEnd: [this.data.employee?.shiftEnd ?? '17:00', [Validators.required]],
    assignedSpot: [this.data.employee?.assignedSpot ?? ''],
    status: [
      this.data.employee?.status ?? ('on-duty' as EmployeeStatus),
      [Validators.required],
    ],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    /*
      Build a new Employee instance (the entity, not a plain object).
    */
    const employee = new Employee({
      id: this.data.employee?.id ?? this.generateId(),
      parkingId: this.data.employee?.parkingId ?? '',
      name: value.name.trim(),
      role: value.role,
      schedule: value.schedule,
      shiftStart: value.shiftStart,
      shiftEnd: value.shiftEnd,
      assignedSpot: value.assignedSpot.trim() ? value.assignedSpot.trim().toUpperCase() : null,
      status: value.status,
    });

    this.dialogRef.close(employee);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  private generateId(): string {
    return `emp-${crypto.randomUUID().slice(0, 8)}`;
  }
}
