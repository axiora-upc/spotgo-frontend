import { Injectable, signal } from '@angular/core';

export type ViewMode = 'user' | 'admin';

@Injectable({ providedIn: 'root' })
export class ViewModeService {
  readonly mode = signal<ViewMode>('user');

  setMode(mode: ViewMode): void {
    this.mode.set(mode);
  }
}
