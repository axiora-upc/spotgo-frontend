import { Injectable, inject, signal } from '@angular/core';
import { retry } from 'rxjs';
import { Admin } from '../domain/model/admin.entity';
import { ProfilesApi } from '../infrastructure/profiles-api';

/*
  ProfilesStore is the application layer for the profiles bounded context.
  It holds the Admin state consumed by SettingsComponent and is the
  only place that orchestrates HTTP calls from ProfilesApi.

  Public API:
  - signals: admin, loading, error
  - methods: loadAdmin(id), updateAdmin(admin, callbacks?)
*/
@Injectable({ providedIn: 'root' })
export class ProfilesStore {
  private readonly profilesApi = inject(ProfilesApi);

  private readonly adminSignal = signal<Admin | null>(null);
  readonly admin = this.adminSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  /*
    Fetches the admin with the given id from the API and stores it
    in the admin signal. The view calls this once on init.
  */
  loadAdmin(id: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.profilesApi.getAdminById(id).subscribe({
      next: (admin) => {
        this.adminSignal.set(admin);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to load admin'));
        this.loadingSignal.set(false);
      },
    });
  }

  /*
    Sends updated admin data to the API (HTTP PUT) and, on success,
    updates the in-memory signal so the view re-renders without a
    second fetch.
  */
  updateAdmin(
    admin: Admin,
    callbacks?: { onSuccess?: () => void; onError?: () => void }
  ): void {
    this.profilesApi
      .updateAdmin(admin)
      .pipe(retry(1))
      .subscribe({
        next: (updated) => {
          this.adminSignal.set(updated);
          callbacks?.onSuccess?.();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to update admin'));
          callbacks?.onError?.();
        },
      });
  }

  private formatError(err: unknown, fallback: string): string {
    if (err instanceof Error) {
      return err.message.includes('Resource not found')
        ? `${fallback}: not found`
        : err.message;
    }
    return fallback;
  }
}
