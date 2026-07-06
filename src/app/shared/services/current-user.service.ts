import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  get adminId(): string {
    return sessionStorage.getItem('spotgo:adminId') ?? '';
  }

  get clientId(): string {
    return sessionStorage.getItem('spotgo:clientId') ?? '';
  }

  get parkingId(): string {
    return sessionStorage.getItem('spotgo:parkingId') ?? '';
  }
}
