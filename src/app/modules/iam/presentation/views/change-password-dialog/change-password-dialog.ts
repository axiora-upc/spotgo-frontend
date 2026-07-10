import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '../../../application/auth.store';

/*
  ChangePasswordDialog is opened from ToolbarContent's account menu, so
  it is reachable by any authenticated user regardless of role (admin or
  client) — unlike the profiles module's Settings page, which only exists
  for admins.

  It asks for the current password (unlike ForgotPassword, which is the
  "I don't have it anymore" path) before allowing a new one.
*/
@Component({
  selector: 'app-change-password-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatIcon, TranslatePipe],
  templateUrl: './change-password-dialog.html',
  styleUrl: './change-password-dialog.css',
})
export class ChangePasswordDialog {
  private readonly authStore = inject(AuthStore);
  private readonly dialogRef = inject(MatDialogRef<ChangePasswordDialog>);

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly success = signal(false);

  protected readonly showCurrent = signal(false);
  protected readonly showNew = signal(false);
  protected readonly showConfirm = signal(false);

  protected toggleShowCurrent(): void { this.showCurrent.update((v) => !v); }
  protected toggleShowNew(): void { this.showNew.update((v) => !v); }
  protected toggleShowConfirm(): void { this.showConfirm.update((v) => !v); }

  /*
    Same shape as Register's passwordsMatch validator: a form-level check
    because it compares two sibling controls.
  */
  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword && confirmPassword && newPassword !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  }

  private passwordPolicy(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string | null;
    if (!value) return null;
    return value.length >= 8
      && /[A-Z]/.test(value)
      && /[a-z]/.test(value)
      && /\d/.test(value)
      && /[^A-Za-z0-9]/.test(value)
      ? null
      : { passwordPolicy: true };
  }

  protected readonly form = new FormGroup(
    {
      currentPassword: new FormControl('', [Validators.required]),
      newPassword: new FormControl('', [Validators.required, (control) => this.passwordPolicy(control)]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: (group) => this.passwordsMatch(group) }
  );

  protected getError(field: 'currentPassword' | 'newPassword' | 'confirmPassword'): string | null {
    const control = this.form.get(field);
    if (!control || !control.touched) return null;

    if (control.invalid) {
      if (control.hasError('required')) return 'iam.errors.required';
      if (control.hasError('passwordPolicy')) return 'iam.errors.password-policy';
    }

    if (field === 'confirmPassword' && this.form.hasError('passwordMismatch') && control.value) {
      return 'iam.errors.password-mismatch';
    }

    return null;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.serverError.set(null);
    this.submitting.set(true);

    const { currentPassword, newPassword } = this.form.getRawValue();

    this.authStore.changePassword(currentPassword!, newPassword!, {
      onSuccess: () => {
        this.submitting.set(false);
        this.success.set(true);
      },
      onError: (messageKey) => {
        this.submitting.set(false);
        this.serverError.set(messageKey);
      },
    });
  }

  protected close(): void {
    this.dialogRef.close();
  }
}
