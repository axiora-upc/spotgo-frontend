import { Injectable } from '@angular/core';

// All users live in the unified /users table (roles via /userRoles).
// Change these constants to switch the active test session.
const DEFAULT_ADMIN_ID   = 'usr-001';
const DEFAULT_CLIENT_ID  = 'usr-004';
const DEFAULT_PARKING_ID = 'prk-001';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  readonly adminId   = sessionStorage.getItem('spotgo:adminId')   ?? DEFAULT_ADMIN_ID;
  readonly clientId  = sessionStorage.getItem('spotgo:clientId')  ?? DEFAULT_CLIENT_ID;
  readonly parkingId = sessionStorage.getItem('spotgo:parkingId') ?? DEFAULT_PARKING_ID;
}
