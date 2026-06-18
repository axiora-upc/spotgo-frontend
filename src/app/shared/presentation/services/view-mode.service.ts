import { Injectable, signal } from '@angular/core';

export type ViewMode = 'user' | 'admin';

const STORAGE_KEY = 'spotgo:viewMode';

@Injectable({ providedIn: 'root' })
export class ViewModeService {
  readonly mode = signal<ViewMode>(
    (sessionStorage.getItem(STORAGE_KEY) as ViewMode | null) ?? 'user'
  );

  setMode(mode: ViewMode): void {
    sessionStorage.setItem(STORAGE_KEY, mode);
    this.mode.set(mode);
  }
}
