import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '../../../application/auth.store';
import { LanguageSwitcher } from '../../../../../shared/presentation/components/language-switcher/language-switcher';

/*
  ForgotPassword is the "I don't have my password anymore" path — as
  opposed to ChangePasswordDialog, which requires knowing the current one.

  See IamApi.resetPassword for why this is a single-step form (email +
  new password) instead of a real email-based reset flow: this mock
  backend has no email service to send a reset link through. It still
  checks the email actually belongs to an existing account before
  touching anything.
*/
@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, MatIcon, TranslatePipe, LanguageSwitcher],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly authStore = inject(AuthStore);

  protected readonly loading = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly success = signal(false);

  protected readonly showNew = signal(false);
  protected readonly showConfirm = signal(false);

  protected toggleShowNew(): void { this.showNew.update((v) => !v); }
  protected toggleShowConfirm(): void { this.showConfirm.update((v) => !v); }

  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword && confirmPassword && newPassword !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  }

  protected readonly form = new FormGroup(
    {
      email: new FormControl('', [Validators.required, Validators.email]),
      newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: (group) => this.passwordsMatch(group) }
  );

  protected getError(field: 'email' | 'newPassword' | 'confirmPassword'): string | null {
    const control = this.form.get(field);
    if (!control || !control.touched) return null;

    if (control.invalid) {
      if (control.hasError('required')) return 'iam.errors.required';
      if (control.hasError('email')) return 'iam.errors.email-invalid';
      if (control.hasError('minlength')) return 'iam.errors.password-min';
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
    this.loading.set(true);

    const { email, newPassword } = this.form.getRawValue();

    this.authStore.resetPassword(email!, newPassword!, {
      onSuccess: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      onError: (messageKey) => {
        this.loading.set(false);
        this.serverError.set(messageKey);
      },
    });
  }
}
