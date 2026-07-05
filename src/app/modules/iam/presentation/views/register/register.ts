import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormGroup,
  FormControl,
  ValidationErrors,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '../../../application/auth.store';
import { defaultRouteForRole } from '../../../application/default-route.util';
import { Role } from '../../../domain/model/user.entity';
import { LanguageSwitcher } from '../../../../../shared/presentation/components/language-switcher/language-switcher';

type AccountType = 'driver' | 'operator';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, MatIcon, TranslatePipe, LanguageSwitcher],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly accountType = signal<AccountType>('driver');

  protected readonly loading = this.authStore.loading;
  protected readonly error = this.authStore.error;

  /*
    Independent visibility toggles: password and confirmPassword are two
    separate fields, so revealing one should not affect the other.
  */
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  protected toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  /*
    passwordsMatch is a form-level validator (not tied to a single control)
    because it needs to compare two sibling controls: password and
    confirmPassword.
  */
  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  }

  protected readonly form = new FormGroup(
    {
      firstName: new FormControl('', [Validators.required, Validators.minLength(2)]),
      lastName: new FormControl('', [Validators.required, Validators.minLength(2)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: (group) => this.passwordsMatch(group) }
  );

  protected selectAccountType(type: AccountType): void {
    this.accountType.set(type);
  }

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

  protected getError(field: 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword'): string | null {
    const control = this.form.get(field);
    if (!control || !control.touched) return null;

    if (control.invalid) {
      if (control.hasError('required')) return 'iam.errors.required';
      if (control.hasError('email')) return 'iam.errors.email-invalid';
      if (control.hasError('minlength')) {
        return field === 'password' ? 'iam.errors.password-min' : 'iam.errors.name-min';
      }
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

    const { firstName, lastName, email, password } = this.form.getRawValue();
    const role: Role = this.accountType() === 'operator' ? 'admin' : 'client';

    this.authStore.register(
      { firstName: firstName!, lastName: lastName!, email: email!, password: password!, role },
      { onSuccess: (user) => this.router.navigateByUrl(defaultRouteForRole(user.role)) }
    );
  }

  protected googleMessage = signal<string | null>(null);

  protected onGoogleSignUp(): void {
    this.googleMessage.set('iam.errors.google-unavailable');
  }
}
