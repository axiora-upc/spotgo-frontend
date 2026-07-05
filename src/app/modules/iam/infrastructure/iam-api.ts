import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BaseApi } from '../../../shared/infrastructure/base-api';
import { UsersApiEndpoint } from './users-api-endpoint';
import { UserResource } from './user-response';
import { RoleResource, UserRoleResource } from './role-response';
import { User, Role } from '../domain/model/user.entity';

/*
  Maps a Role to its id in the /roles resource (server/db.json).
  Used when writing a new /userRoles row during registration.
*/
const ROLE_IDS: Record<Role, string> = {
  admin: 'rol-001',
  client: 'rol-002',
};

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
}

/*
  Minimal shape of a /parkings row, duplicated here instead of imported
  from the monitoring module's ParkingResource on purpose: IAM only needs
  to know enough to provision an empty, valid row for a brand-new
  Operator — it should not depend on monitoring's internals (each module
  only talks to the others through the shared /api* resources, never by
  importing each other's domain/infrastructure types).
*/
interface NewParkingResource {
  id: string;
  adminId: string;
  name: string;
  address: string;
  city: string;
  totalSpaces: number;
  availableSpaces: number;
  totalFloors: number;
  averageOccupancy: number;
  peakHour: string;
  totalRevenue: number;
  systemStatus: string;
  rating: number;
  pricePerHour: number;
}

/*
  IamApi is the single entry point for all authentication HTTP operations.

  Unlike other bounded contexts, /users, /roles and /userRoles are three
  related tables in the mock backend (server/db.json). IamApi is the only
  place that knows how to join them to answer "who is this user and what
  is their role" (login) or "create a user and assign them a role"
  (register).

  The store (AuthStore) only calls login()/register() — it never touches
  HttpClient or the join tables directly.
*/
@Injectable({ providedIn: 'root' })
export class IamApi extends BaseApi {
  private readonly usersEndpoint: UsersApiEndpoint;

  constructor(private http: HttpClient) {
    super();
    this.usersEndpoint = new UsersApiEndpoint(http);
  }

  /*
    Looks up the user by email, checks the password and resolves their
    role through /userRoles + /roles.

    NOTE: this compares plain-text passwords stored in server/db.json.
    This is a mock backend for demo/testing purposes only — a real
    backend must never store or compare passwords this way.
  */
  login(email: string, password: string): Observable<User> {
    return this.usersEndpoint.findResourceByEmail(this.normalizeEmail(email)).pipe(
      switchMap(resources => {
        const resource = resources[0];
        if (!resource || resource.password !== password) {
          return throwError(() => new Error('iam.errors.invalid-credentials'));
        }
        return this.resolveRole(resource.id).pipe(
          map(role => this.toUser(resource, role))
        );
      }),
      catchError(err => throwError(() => err instanceof Error ? err : new Error('iam.errors.generic')))
    );
  }

  /*
    Creates a new user with the chosen role (Driver -> client,
    Operator -> admin), then links it to that role via /userRoles.

    Operators additionally get their own /parkings row (see
    provisionParkingFor). Without this, a new Operator's parkingId stays
    null, and CurrentUserService — which every admin view reads from —
    falls back to its hardcoded DEFAULT_PARKING_ID ('prk-001'). That
    fallback exists so the rest of the app has *something* to show before
    IAM existed; now that real Operators can register, it meant a brand
    new admin landed on realtime-map and saw Piero's blueprint, spots and
    stats instead of their own empty parking. Provisioning a real (empty)
    parking at registration time removes that fallback path entirely.
  */
  register(payload: RegisterPayload): Observable<User> {
    const email = this.normalizeEmail(payload.email);

    return this.usersEndpoint.findResourceByEmail(email).pipe(
      switchMap(existing => {
        if (existing.length > 0) {
          return throwError(() => new Error('iam.errors.email-taken'));
        }

        const newResource: UserResource = {
          id: this.generateId('usr'),
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          email,
          password: payload.password,
          phone: '',
          city: '',
          parkingName: '',
          // '' rather than null: json-server's DELETE handler cascades
          // across every collection looking for "...Id" fields to check
          // for dangling references (mixins.js getRemovable), and calls
          // .toString() on each value found. A null value there crashes
          // *any* DELETE request anywhere in the app with a 500 (see
          // server/db.json client accounts that had this null before).
          // '' is falsy just like null for every truthy check in this
          // codebase (AuthStore.applySession, CurrentUserService), but
          // it has a .toString() and doesn't blow up json-server.
          parkingId: '',
        };

        return this.usersEndpoint.createResource(newResource).pipe(
          switchMap(created =>
            payload.role === 'admin'
              ? this.provisionParkingFor(created).pipe(
                  switchMap(withParking => this.assignRole(withParking.id, payload.role).pipe(
                    map(() => this.toUser(withParking, payload.role))
                  ))
                )
              : this.assignRole(created.id, payload.role).pipe(
                  map(() => this.toUser(created, payload.role))
                )
          )
        );
      }),
      catchError(err => throwError(() => err instanceof Error ? err : new Error('iam.errors.generic')))
    );
  }

  /*
    Creates a fresh, empty /parkings row for a new Operator and patches
    their /users row to point at it (parkingId + a friendly parkingName).
    Returns the updated UserResource so the caller can build the final
    User entity with the real parkingId instead of null.
  */
  private provisionParkingFor(user: UserResource): Observable<UserResource> {
    const parkingName = `${user.firstName}'s Parking`;

    const newParking: NewParkingResource = {
      id: this.generateId('prk'),
      adminId: user.id,
      name: parkingName,
      address: '',
      city: '',
      totalSpaces: 0,
      availableSpaces: 0,
      totalFloors: 0,
      averageOccupancy: 0,
      peakHour: '--:--',
      totalRevenue: 0,
      systemStatus: 'active',
      rating: 0,
      pricePerHour: 0,
    };

    return this.http.post<NewParkingResource>(`${environment.apiUrl}/parkings`, newParking).pipe(
      switchMap(created =>
        this.http
          .patch<UserResource>(`${environment.apiUrl}/users/${user.id}`, {
            parkingId: created.id,
            parkingName,
          })
          .pipe(map(updated => ({ ...user, ...updated })))
      )
    );
  }

  /*
    Changes the password of the currently authenticated user. Requires the
    current password to match (the caller — AuthStore — never has a stale
    or missing currentPassword; the form always asks for it), then PATCHes
    only the password field, so nothing else about the account is touched.
  */
  changePassword(userId: string, currentPassword: string, newPassword: string): Observable<void> {
    return this.http.get<UserResource>(`${environment.apiUrl}/users/${userId}`).pipe(
      switchMap(resource => {
        if (resource.password !== currentPassword) {
          return throwError(() => new Error('iam.errors.current-password-invalid'));
        }
        return this.http.patch<UserResource>(`${environment.apiUrl}/users/${userId}`, {
          password: newPassword,
        });
      }),
      map(() => undefined),
      catchError(err => throwError(() => err instanceof Error ? err : new Error('iam.errors.generic')))
    );
  }

  /*
    Resets the password for the account matching the given email, without
    requiring the old password — this is the "Forgot password" flow.

    NOTE: a real backend would email a one-time reset link and never let
    a bare email set a new password directly. This mock backend has no
    email service to send that link through, so this is a deliberately
    simplified stand-in scoped to this demo. It still won't let someone
    "reset" an account that doesn't exist (email-not-found), which is the
    one check that matters for the UI to behave sensibly.
  */
  resetPassword(email: string, newPassword: string): Observable<void> {
    return this.usersEndpoint.findResourceByEmail(this.normalizeEmail(email)).pipe(
      switchMap(resources => {
        const resource = resources[0];
        if (!resource) {
          return throwError(() => new Error('iam.errors.email-not-found'));
        }
        return this.http.patch<UserResource>(`${environment.apiUrl}/users/${resource.id}`, {
          password: newPassword,
        });
      }),
      map(() => undefined),
      catchError(err => throwError(() => err instanceof Error ? err : new Error('iam.errors.generic')))
    );
  }

  /*
    Reads /userRoles?userId=<id> to find the roleId, then /roles/<roleId>
    to get its name ('admin' | 'client'). forkJoin is not used here because
    the second call depends on the result of the first (switchMap chain).
  */
  private resolveRole(userId: string): Observable<Role> {
    return this.http
      .get<UserRoleResource[]>(`${environment.apiUrl}/userRoles?userId=${userId}`)
      .pipe(
        switchMap(userRoles => {
          const userRole = userRoles[0];
          if (!userRole) return throwError(() => new Error('iam.errors.no-role'));
          return this.http.get<RoleResource>(`${environment.apiUrl}/roles/${userRole.roleId}`);
        }),
        map(role => role.name)
      );
  }

  private assignRole(userId: string, role: Role): Observable<UserRoleResource> {
    const userRole: UserRoleResource = {
      id: this.generateId('ur'),
      userId,
      roleId: ROLE_IDS[role],
    };
    return this.http.post<UserRoleResource>(`${environment.apiUrl}/userRoles`, userRole);
  }

  private toUser(resource: UserResource, role: Role): User {
    return new User({
      id: resource.id,
      firstName: resource.firstName,
      lastName: resource.lastName,
      email: resource.email,
      phone: resource.phone,
      city: resource.city,
      parkingName: resource.parkingName,
      parkingId: resource.parkingId,
      role,
    });
  }

  private generateId(prefix: string): string {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  /*
    server/db.json is queried through json-server's `?email=` filter, which
    does an exact, case-sensitive, whitespace-sensitive string match — it
    is NOT the same as a real backend's case-insensitive email lookup.

    Without this normalization, a user who registers as "Jane@Mail.com"
    (or whose email gets auto-capitalized/trimmed differently by the
    browser between the register and login forms) would create an account
    that can never be found again by login(), since "jane@mail.com" !==
    "Jane@Mail.com" as far as json-server's filter is concerned — this
    surfaces as a false "invalid email or password" error even with the
    exact right credentials.

    Normalizing here (once, in the one place that talks to /users) means
    every account is stored and looked up the same way regardless of how
    it was typed.
  */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
