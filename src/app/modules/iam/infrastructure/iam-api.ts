import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BaseApi } from '../../../shared/infrastructure/base-api';
import { AuthenticatedUserResource, UserResource } from './user-response';
import { User, Role } from '../domain/model/user.entity';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
}

interface AuthResult {
  user: User;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class IamApi extends BaseApi {
  constructor(private readonly http: HttpClient) {
    super();
  }

  login(email: string, password: string): Observable<AuthResult> {
    return this.http
      .post<AuthenticatedUserResource>(`${environment.apiUrl}/authentication/sign-in`, {
        email: this.normalizeEmail(email),
        password,
      })
      .pipe(
        map((resource) => ({ user: this.toUser(resource), token: resource.token })),
        catchError((err) => throwError(() => this.toError(err, 'iam.errors.invalid-credentials')))
      );
  }

  register(payload: RegisterPayload): Observable<AuthResult> {
    return this.http
      .post<AuthenticatedUserResource>(`${environment.apiUrl}/authentication/sign-up`, {
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: this.normalizeEmail(payload.email),
        password: payload.password,
      })
      .pipe(
        map((resource) => ({ user: this.toUser(resource), token: resource.token })),
        catchError((err) => throwError(() => this.toError(err, 'iam.errors.email-taken')))
      );
  }

  changePassword(userId: string, currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .patch<void>(`${environment.apiUrl}/users/${userId}/password`, {
        currentPassword,
        newPassword,
      })
      .pipe(catchError((err) => throwError(() => this.toError(err, 'iam.errors.current-password-invalid'))));
  }

  resetPassword(email: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${environment.apiUrl}/authentication/reset-password`, {
        email: this.normalizeEmail(email),
        newPassword,
      })
      .pipe(catchError((err) => throwError(() => this.toError(err, 'iam.errors.email-not-found'))));
  }

  private toUser(resource: UserResource): User {
    return new User({
      id: resource.id,
      firstName: resource.firstName,
      lastName: resource.lastName,
      email: resource.email,
      phone: resource.phone,
      city: resource.city,
      parkingName: resource.parkingName,
      parkingId: resource.parkingId,
      role: resource.role,
    });
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toError(err: any, fallback: string): Error {
    const message = err?.error?.details ?? err?.error?.message ?? err?.message ?? fallback;
    return new Error(message);
  }
}
