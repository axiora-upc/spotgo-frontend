/*
  Employees view of the Real-time Map page.

  After the DDD refactor the component is a thin UI layer:
  - it does NOT call HttpClient directly;
  - it does NOT keep state of its own;
  - it asks MonitoringStore for the list and forwards user intents
    (add / edit / delete) back to it.

  The Store owns the employees signal, the loading flag and the error
  state. The view just renders what is there and opens the dialogs.
*/
import { Component, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

import { Employee } from '../../../../domain/model/employee.entity';
import { MonitoringStore } from '../../../../application/monitoring.store';
import { EmployeeForm, EmployeeFormData } from './employee-form/employee-form';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../../../shared/presentation/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-realtime-map-employees',
  imports: [NgClass, MatButtonModule, MatIcon, TranslatePipe],
  templateUrl: './employees.html',
  styleUrl: './employees.css',
})
export class Employees implements OnInit {
  protected readonly store = inject(MonitoringStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  ngOnInit(): void {
    this.store.loadEmployees();
  }

  protected openCreateDialog(): void {
    const data: EmployeeFormData = { mode: 'create' };

    this.dialog
      .open<EmployeeForm, EmployeeFormData, Employee>(EmployeeForm, {
        data,
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.store.addEmployee(result, {
          onSuccess: () =>
            this.showSuccess('realtime-map.employees.snackbar.create-success'),
          onError: () =>
            this.showError('realtime-map.employees.snackbar.create-error'),
        });
      });
  }

  protected openEditDialog(employee: Employee): void {
    const data: EmployeeFormData = { mode: 'edit', employee };

    this.dialog
      .open<EmployeeForm, EmployeeFormData, Employee>(EmployeeForm, {
        data,
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.store.updateEmployee(result, {
          onSuccess: () =>
            this.showSuccess('realtime-map.employees.snackbar.edit-success'),
          onError: () =>
            this.showError('realtime-map.employees.snackbar.edit-error'),
        });
      });
  }

  protected confirmDelete(employee: Employee): void {
    const data: ConfirmDialogData = {
      titleKey: 'realtime-map.employees.delete-confirm.title',
      messageKey: 'realtime-map.employees.delete-confirm.message',
      confirmKey: 'realtime-map.employees.delete-confirm.confirm',
      cancelKey: 'realtime-map.employees.delete-confirm.cancel',
      iconName: 'warning',
      tone: 'danger',
    };

    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.store.deleteEmployee(employee.id, {
          onSuccess: () =>
            this.showSuccess('realtime-map.employees.snackbar.delete-success'),
          onError: () =>
            this.showError('realtime-map.employees.snackbar.delete-error'),
        });
      });
  }

  private showSuccess(key: string): void {
    const message = this.translate.instant(key);
    const close = this.translate.instant('shared.snackbar.close');
    this.snackBar.open(message, close, {
      duration: 3000,
      panelClass: ['snackbar', 'snackbar--success'],
    });
  }

  private showError(key: string): void {
    const message = this.translate.instant(key);
    const close = this.translate.instant('shared.snackbar.close');
    this.snackBar.open(message, close, {
      duration: 5000,
      panelClass: ['snackbar', 'snackbar--error'],
    });
  }
}
