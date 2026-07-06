import { Injectable, computed, inject, signal } from '@angular/core';
import { IamApi, RegisterPayload } from '../infrastructure/iam-api';
import { User, Role } from '../domain/model/user.entity';
import { ViewModeService } from '../../../shared/presentation/services/view-mode.service';

/*
  Session storage keys.

  SESSION_KEY persists the authenticated user across page reloads (same
  tab), the same way ViewModeService persists the sidebar mode.

  ADMIN_ID_KEY / CLIENT_ID_KEY / PARKING_ID_KEY are NOT new — they are the
  exact keys CurrentUserService already reads on construction
  (see shared/services/current-user.service.ts). AuthStore writes to them
  on login/register so the rest of the app (dashboard, settings,
  subscriptions, etc.) automatically reflects whichever test user just
  signed in, without those modules needing to know IAM exists.
*/
const SESSION_KEY = 'spotgo:authUser';
const TOKEN_KEY = 'spotgo:accessToken';
const ADMIN_ID_KEY = 'spotgo:adminId';
const CLIENT_ID_KEY = 'spotgo:clientId';
const PARKING_ID_KEY = 'spotgo:parkingId';

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
  private readonly viewMode = inject(ViewModeService);

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
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_ID_KEY);
    sessionStorage.removeItem(CLIENT_ID_KEY);
    sessionStorage.removeItem(PARKING_ID_KEY);
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

  /*
    Used by the ForgotPassword view, reachable from the login page without
    being authenticated — that's the whole point. See IamApi.resetPassword
    for the mock-backend caveat (no email/token verification here).
  */
  resetPassword(
    email: string,
    newPassword: string,
    callbacks?: { onSuccess?: () => void; onError?: (messageKey: string) => void }
  ): void {
    this.iamApi.resetPassword(email, newPassword).subscribe({
      next: () => callbacks?.onSuccess?.(),
      error: (err) => callbacks?.onError?.(this.messageKeyFrom(err)),
    });
  }

  /*
    Persists the user in sessionStorage, updates the currentUser signal,
    wires up CurrentUserService's keys, and sets the sidebar's view mode
    (admin/user) based on the real role instead of a manual toolbar toggle.
  */
  private applySession(user: User, token: string): void {
    sessionStorage.removeItem(ADMIN_ID_KEY);
    sessionStorage.removeItem(CLIENT_ID_KEY);
    sessionStorage.removeItem(PARKING_ID_KEY);

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
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored));
    sessionStorage.setItem(TOKEN_KEY, token);

    if (user.role === 'admin') {
      sessionStorage.setItem(ADMIN_ID_KEY, user.id);
      if (user.parkingId) sessionStorage.setItem(PARKING_ID_KEY, user.parkingId);
    } else {
      sessionStorage.setItem(CLIENT_ID_KEY, user.id);
    }

    this.viewMode.setMode(user.role === 'admin' ? 'admin' : 'user');
    this.userSignal.set(user);
  }

  private restoreSession(): User | null {
    const raw = sessionStorage.getItem(SESSION_KEY);
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
