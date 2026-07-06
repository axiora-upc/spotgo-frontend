import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { NgClass, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import { MonitoringStore } from '../../../application/monitoring.store';
import { SpotUtilization } from '../../../domain/model/analytics.entity';
import { CurrentUserService } from '../../../../../shared/services/current-user.service';

const INITIAL_SPOTS_SHOWN = 3;

@Component({
  selector: 'app-analytics',
  imports: [NgClass, CurrencyPipe, DecimalPipe, MatIcon, TranslatePipe],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics implements OnInit {
  protected readonly store       = inject(MonitoringStore);
  private  readonly currentUser  = inject(CurrentUserService);

  protected selectedPeriod = signal<'today' | 'last7' | 'custom'>('today');

  /* ─── Paginación de la tabla ─────────────────────────────────────────────── */

  /*
    spotsShown determina cuántas filas de la tabla se renderizan.
    El botón "Load More" suma INITIAL_SPOTS_SHOWN a este valor.
  */
  protected spotsShown = signal(INITIAL_SPOTS_SHOWN);

  /*
    visibleSpots es un computed que corta el array completo de spots
    al número actual de spotsShown. La tabla solo renderiza este slice.
  */
  protected visibleSpots = computed<SpotUtilization[]>(() => {
    const analytics = this.store.analytics();
    if (!analytics) return [];
    return analytics.mostUtilizedSpots.slice(0, this.spotsShown());
  });

  /*
    hasMoreSpots es true cuando quedan spots por mostrar.
    El botón "Load More" se oculta cuando todos los spots ya están visibles.
  */
  protected hasMoreSpots = computed<boolean>(() => {
    const analytics = this.store.analytics();
    if (!analytics) return false;
    return this.spotsShown() < analytics.mostUtilizedSpots.length;
  });

  /* ─── Ciclo de vida ──────────────────────────────────────────────────────── */

  ngOnInit(): void {
    /*
      Solicita los datos al store en cuanto el componente se monta.
      El store llama a la API solo una vez; si analytics() ya tiene
      data (por navegación de vuelta), la vista la reutiliza.
    */
    this.store.loadAnalytics(this.currentUser.parkingId);
  }

  /* ─── Acciones de la UI ──────────────────────────────────────────────────── */

  protected retry(): void {
    this.store.loadAnalytics(this.currentUser.parkingId);
  }

  protected selectPeriod(period: 'today' | 'last7' | 'custom'): void {
    this.selectedPeriod.set(period);
  }

  /* Muestra INITIAL_SPOTS_SHOWN filas adicionales en la tabla. */
  protected loadMoreSpots(): void {
    this.spotsShown.update((n) => n + INITIAL_SPOTS_SHOWN);
  }

  /* ─── Export Report ──────────────────────────────────────────────────────── */

  /*
    Genera y descarga un archivo .txt con el resumen de los spots
    más utilizados. Usa la API de Blob del navegador; no requiere
    librerías externas.
  */
  protected exportReport(): void {
    const analytics = this.store.analytics();
    if (!analytics) return;

    const lines: string[] = [
      `SpotGo — Most Utilized Spots Report`,
      `Parking: ${analytics.parkingName}`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `LOCATION / SPOT ID         STATUS        DAILY TURNOVER  PEAK UTIL.  REVENUE IMPACT`,
      `─`.repeat(85),
    ];

    analytics.mostUtilizedSpots.forEach((spot) => {
      const name   = spot.spotName.padEnd(26);
      const status = spot.status.toUpperCase().padEnd(14);
      const turn   = `${spot.dailyTurnover} Vehicles`.padEnd(16);
      const peak   = `${spot.peakUtilization}%`.padEnd(12);
      const rev    = `+$${spot.revenueImpact.toFixed(2)}`;
      lines.push(`${name}${status}${turn}${peak}${rev}`);
    });

    lines.push(``, `End of report.`);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `spotgo-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ─── Helpers para los gráficos SVG ─────────────────────────────────────── */

  /*
    Devuelve true si este punto horario tiene la intensidad máxima.
    La barra del peak se renderiza con el color oscuro del mockup.
  */
  protected isPeakBar(intensity: number): boolean {
    const analytics = this.store.analytics();
    if (!analytics) return false;
    const max = Math.max(...analytics.occupancyByHour.map((p) => p.intensity));
    return intensity === max;
  }

  /*
    Convierte el array weeklyTrends en una cadena de puntos SVG para
    el elemento <polyline>. El viewBox del SVG es 280 × 80.
    Cada punto X se distribuye uniformemente; Y se invierte porque
    SVG crece hacia abajo (0 = arriba, h = abajo).
  */
  protected weeklyPolyline(): string {
    const analytics = this.store.analytics();
    if (!analytics || analytics.weeklyTrends.length === 0) return '';

    const points = analytics.weeklyTrends;
    const w = 280;
    const h = 80;
    const step = w / (points.length - 1);

    return points
      .map((p, i) => `${i * step},${h - p.value * h}`)
      .join(' ');
  }
}

