import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '../../../application/auth.store';
import { defaultRouteForRole } from '../../../application/default-route.util';
import { LanguageSwitcher } from '../../../../../shared/presentation/components/language-switcher/language-switcher';

/*
  AccountType is the UI-facing label for what the domain calls Role.

  - 'driver'   -> maps to Role 'client'
  - 'operator' -> maps to Role 'admin'

  It only drives which marketing copy is shown on the right panel and the
  label of the submit button. The actual redirect after a successful login
  always uses the REAL role returned by the backend (see onSubmit), so
  picking the "wrong" tab before signing in has no effect on where the
  user ends up.
*/
type AccountType = 'driver' | 'operator';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, MatIcon, TranslatePipe, LanguageSwitcher],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly accountType = signal<AccountType>('driver');

  protected readonly loading = this.authStore.loading;
  protected readonly error = this.authStore.error;
  protected readonly googleMessage = signal<string | null>(null);

  /*
    Controls whether the password field shows plain text or dots.
    Starts hidden (the normal, safer default); the eye button just
    reveals it temporarily so the user can double check what they typed.
  */
  protected readonly showPassword = signal(false);

  protected toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  protected selectAccountType(type: AccountType): void {
    this.accountType.set(type);
  }

  /*
    Marketing copy on the right panel switches with the selected account
    type, so a driver and an operator each see benefits relevant to them
    before they even sign in.
  */
  protected readonly heroFeatures = computed(() =>
    this.accountType() === 'driver'
      ? [
          'iam.login.feature-driver-1',
          'iam.login.feature-driver-2',
          'iam.login.feature-driver-3',
          'iam.login.feature-driver-4',
        ]
      : [
          'iam.login.feature-operator-1',
          'iam.login.feature-operator-2',
          'iam.login.feature-operator-3',
          'iam.login.feature-operator-4',
        ]
  );

  protected getError(field: 'email' | 'password'): string | null {
    const control = this.form.get(field);
    if (!control || !control.touched || control.valid) return null;
    if (control.hasError('required')) return 'iam.errors.required';
    if (control.hasError('email')) return 'iam.errors.email-invalid';
    return null;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();

    this.authStore.login(email!, password!, {
      onSuccess: (user) => this.router.navigateByUrl(defaultRouteForRole(user.role)),
    });
  }

  protected onGoogleSignIn(): void {
    // Google sign-in is out of scope for this mock backend.
    this.googleMessage.set('iam.errors.google-unavailable');
  }
}
