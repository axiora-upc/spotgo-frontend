import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '../../../application/auth.store';
import { defaultRouteForRole } from '../../../application/default-route.util';
import { LanguageSwitcher } from '../../../../../shared/presentation/components/language-switcher/language-switcher';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, MatIcon, TranslatePipe, LanguageSwitcher],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly loading = this.authStore.loading;
  protected readonly error = this.authStore.error;

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

  protected readonly heroFeatures = [
    'iam.login.feature-driver-1',
    'iam.login.feature-driver-2',
    'iam.login.feature-driver-3',
    'iam.login.feature-driver-4',
  ];

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
}
