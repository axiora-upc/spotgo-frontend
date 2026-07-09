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
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

import { Employee } from '../../../../domain/model/employee.entity';
import { MonitoringStore } from '../../../../application/monitoring.store';
import { MonitoringApi } from '../../../../infrastructure/monitoring-api';
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
  private readonly monitoringApi = inject(MonitoringApi);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 5;
  private readonly spotOptions = signal<string[]>([]);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.store.employees().length / this.pageSize))
  );

  protected readonly pagedEmployees = computed(() => {
    const safePage = Math.min(this.currentPage(), this.totalPages());
    const start = (safePage - 1) * this.pageSize;
    return this.store.employees().slice(start, start + this.pageSize);
  });

  protected readonly pageStart = computed(() => {
    if (this.store.employees().length === 0) return 0;
    return (Math.min(this.currentPage(), this.totalPages()) - 1) * this.pageSize + 1;
  });

  protected readonly pageEnd = computed(() =>
    Math.min(this.pageStart() + this.pagedEmployees().length - 1, this.store.employees().length)
  );

  protected readonly shouldShowPagination = computed(() =>
    this.store.employees().length > this.pageSize
  );

  ngOnInit(): void {
    this.store.loadEmployees();
    this.monitoringApi.getDetectedSpots().subscribe({
      next: (spots) => {
        const codes = spots
          .filter((spot) => spot.row != null && spot.col != null)
          .map((spot) => `${String.fromCharCode(65 + (spot.row ?? 0))}${(spot.col ?? 0) + 1}`)
          .sort((left, right) => {
            const leftRow = left.charCodeAt(0);
            const rightRow = right.charCodeAt(0);
            if (leftRow !== rightRow) return leftRow - rightRow;
            return Number.parseInt(left.slice(1), 10) - Number.parseInt(right.slice(1), 10);
          });
        this.spotOptions.set(codes);
      },
    });
  }

  protected openCreateDialog(): void {
    const data: EmployeeFormData = { mode: 'create', spotOptions: this.spotOptions() };

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
          onSuccess: () => {
            this.currentPage.set(this.totalPages());
            this.showSuccess('realtime-map.employees.snackbar.create-success');
          },
          onError: () =>
            this.showError('realtime-map.employees.snackbar.create-error'),
        });
      });
  }

  protected openEditDialog(employee: Employee): void {
    const data: EmployeeFormData = { mode: 'edit', employee, spotOptions: this.spotOptions() };

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
          onSuccess: () => {
            this.currentPage.update((page) => Math.min(page, this.totalPages()));
            this.showSuccess('realtime-map.employees.snackbar.delete-success');
          },
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
    const backendMessage = this.store.error();
    const message = backendMessage && !backendMessage.startsWith('Failed to')
      ? backendMessage
      : this.translate.instant(key);
    const close = this.translate.instant('shared.snackbar.close');
    this.snackBar.open(message, close, {
      duration: 5000,
      panelClass: ['snackbar', 'snackbar--error'],
    });
  }

  protected goToPreviousPage(): void {
    this.currentPage.update((page) => Math.max(1, page - 1));
  }

  protected goToNextPage(): void {
    this.currentPage.update((page) => Math.min(this.totalPages(), page + 1));
  }
}
