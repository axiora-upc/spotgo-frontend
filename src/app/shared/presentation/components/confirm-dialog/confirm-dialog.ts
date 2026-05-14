/*
  ConfirmDialog is a reusable Angular Material dialog used by any
  destructive action across the app (delete employee, cancel
  reservation, etc.).

  It accepts title / message / confirm / cancel via MAT_DIALOG_DATA
  and closes with `true` if the user confirms, `false` otherwise.

  Translation keys are passed in by the caller, so the dialog itself
  is i18n-agnostic.
*/
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

/*
  Data shape consumed by the dialog. Every field is a translation key
  resolved by the | translate pipe in the template, so the dialog can
  display Spanish or English depending on the active language.
*/
export interface ConfirmDialogData {
  /*
    Title key (e.g. "realtime-map.employees.delete-confirm.title").
  */
  titleKey: string;

  /*
    Body message key.
  */
  messageKey: string;

  /*
    Optional label key for the confirm button. Defaults to
    "shared.confirm-dialog.confirm" if omitted.
  */
  confirmKey?: string;

  /*
    Optional label key for the cancel button. Defaults to
    "shared.confirm-dialog.cancel" if omitted.
  */
  cancelKey?: string;

  /*
    Material icon name shown on the left side of the title.
    Defaults to "help" if omitted.
  */
  iconName?: string;

  /*
    Visual tone of the confirm button:
    - "danger" (default): red, used for destructive actions.
    - "primary": blue, used for non-destructive confirms.
  */
  tone?: 'danger' | 'primary';
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIcon, TranslatePipe],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {
  /*
    Inject the dialog reference and the injected data. Both are
    provided by Angular Material when the dialog is opened via
    MatDialog.open(ConfirmDialog, { data }).
  */
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialog, boolean>);
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  /*
    Defaults used by the template when the caller doesn't override.
  */
  protected readonly defaults = {
    confirmKey: 'shared.confirm-dialog.confirm',
    cancelKey: 'shared.confirm-dialog.cancel',
    iconName: 'help',
    tone: 'danger' as const,
  };

  /*
    User clicked the primary action: close with true so the caller
    proceeds with the destructive operation.
  */
  protected confirm(): void {
    this.dialogRef.close(true);
  }

  /*
    User clicked cancel (or Esc): close with false.
  */
  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
