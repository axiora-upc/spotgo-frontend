import { Injectable, computed, inject, signal } from '@angular/core';
import { IamApi, RegisterPayload } from '../infrastructure/iam-api';
import { User, Role } from '../domain/model/user.entity';

/*
  Local storage keys.

  SESSION_KEY persists the authenticated user across page reloads and
  browser restarts. TOKEN_KEY is used by the API interceptor to authenticate
  protected requests.
*/
const SESSION_KEY = 'spotgo:authUser';
const TOKEN_KEY = 'spotgo:accessToken';
const OBSOLETE_STORAGE_KEYS = ['spotgo:adminId', 'spotgo:clientId', 'spotgo:parkingId', 'spotgo:viewMode'];

interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  parkingName: string;
  parkingId: string | null;
  role: Role;
}

/*
  AuthStore is the application layer for the IAM bounded context.

  It is the only place that holds the authenticated user's state
  (currentUser signal) and the only place the Login/Register views and
  the auth guard talk to.
*/
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly iamApi = inject(IamApi);

  private readonly userSignal = signal<User | null>(this.restoreSession());
  readonly currentUser = this.userSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  login(
    email: string,
    password: string,
    callbacks?: { onSuccess?: (user: User) => void; onError?: (messageKey: string) => void }
  ): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.iamApi.login(email, password).subscribe({
      next: ({ user, token }) => {
        this.applySession(user, token);
        this.loadingSignal.set(false);
        callbacks?.onSuccess?.(user);
      },
      error: (err) => {
        const messageKey = this.messageKeyFrom(err);
        this.errorSignal.set(messageKey);
        this.loadingSignal.set(false);
        callbacks?.onError?.(messageKey);
      },
    });
  }

  register(
    payload: RegisterPayload,
    callbacks?: { onSuccess?: (user: User) => void; onError?: (messageKey: string) => void }
  ): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.iamApi.register(payload).subscribe({
      next: ({ user, token }) => {
        this.applySession(user, token);
        this.loadingSignal.set(false);
        callbacks?.onSuccess?.(user);
      },
      error: (err) => {
        const messageKey = this.messageKeyFrom(err);
        this.errorSignal.set(messageKey);
        this.loadingSignal.set(false);
        callbacks?.onError?.(messageKey);
      },
    });
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    this.removeObsoleteStorageKeys();
    this.userSignal.set(null);
    this.errorSignal.set(null);
  }

  /*
    Used by ChangePasswordDialog, reachable from the toolbar's account menu
    for whoever is currently logged in (admin or client alike). Requires
    the current password on purpose — unlike resetPassword below, this is
    the "I know my password and want a new one" path, not "I forgot it".
  */
  changePassword(
    currentPassword: string,
    newPassword: string,
    callbacks?: { onSuccess?: () => void; onError?: (messageKey: string) => void }
  ): void {
    const user = this.userSignal();
    if (!user) {
      callbacks?.onError?.('iam.errors.generic');
      return;
    }

    this.iamApi.changePassword(user.id, currentPassword, newPassword).subscribe({
      next: () => callbacks?.onSuccess?.(),
      error: (err) => callbacks?.onError?.(this.messageKeyFrom(err)),
    });
  }

  requestPasswordReset(
    email: string,
    callbacks?: { onSuccess?: () => void; onError?: (messageKey: string) => void }
  ): void {
    this.iamApi.requestPasswordReset(email).subscribe({
      next: () => callbacks?.onSuccess?.(),
      error: (err) => callbacks?.onError?.(this.messageKeyFrom(err)),
    });
  }

  confirmPasswordReset(
    email: string,
    code: string,
    newPassword: string,
    callbacks?: { onSuccess?: () => void; onError?: (messageKey: string) => void }
  ): void {
    this.iamApi.confirmPasswordReset({ email, code, newPassword }).subscribe({
      next: () => callbacks?.onSuccess?.(),
      error: (err) => callbacks?.onError?.(this.messageKeyFrom(err)),
    });
  }

  /*
    Persists the user in localStorage, updates the currentUser signal,
    and lets the rest of the app read the authenticated user's role and IDs
    from spotgo:authUser instead of separate localStorage keys.
  */
  private applySession(user: User, token: string): void {
    this.removeObsoleteStorageKeys();

    const stored: StoredUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      city: user.city,
      parkingName: user.parkingName,
      parkingId: user.parkingId,
      role: user.role,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
    localStorage.setItem(TOKEN_KEY, token);
    this.userSignal.set(user);
  }

  private removeObsoleteStorageKeys(): void {
    OBSOLETE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  }

  private restoreSession(): User | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const stored: StoredUser = JSON.parse(raw);
      return new User(stored);
    } catch {
      return null;
    }
  }

  private messageKeyFrom(err: unknown): string {
    if (err instanceof Error && err.message) return err.message;
    return 'iam.errors.generic';
  }
}
