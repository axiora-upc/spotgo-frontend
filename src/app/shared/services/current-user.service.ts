import { Injectable } from '@angular/core';

interface StoredUser {
  id: string;
  parkingId: string | null;
  role: 'user' | 'admin' | 'client';
}

const SESSION_KEY = 'spotgo:authUser';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  get adminId(): string {
    const user = this.getStoredUser();
    return user?.role === 'admin' ? user.id : '';
  }

  get clientId(): string {
    const user = this.getStoredUser();
    return user && user.role !== 'admin' ? user.id : '';
  }

  get parkingId(): string {
    return this.getStoredUser()?.parkingId ?? '';
  }

  private getStoredUser(): StoredUser | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  }
}
