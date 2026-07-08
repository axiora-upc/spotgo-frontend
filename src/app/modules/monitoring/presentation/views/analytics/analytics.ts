import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import { MonitoringStore } from '../../../application/monitoring.store';
import { SpotUtilization } from '../../../domain/model/analytics.entity';

const INITIAL_SPOTS_SHOWN = 3;

@Component({
  selector: 'app-analytics',
  imports: [NgClass, CurrencyPipe, DecimalPipe, MatIcon, TranslatePipe],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics implements OnInit {
  protected readonly store       = inject(MonitoringStore);

  protected selectedPeriod = signal<'today' | 'last7' | 'custom'>('today');
  protected customFrom = signal(this.formatDateInput(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)));
  protected customTo = signal(this.formatDateInput(new Date()));

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
    this.reloadAnalytics();
  }

  /* ─── Acciones de la UI ──────────────────────────────────────────────────── */

  protected retry(): void {
    this.reloadAnalytics();
  }

  protected selectPeriod(period: 'today' | 'last7' | 'custom'): void {
    this.selectedPeriod.set(period);
    this.spotsShown.set(INITIAL_SPOTS_SHOWN);
    if (period !== 'custom') {
      this.reloadAnalytics();
    }
  }

  protected updateCustomFrom(value: string): void {
    this.customFrom.set(value);
  }

  protected updateCustomTo(value: string): void {
    this.customTo.set(value);
  }

  protected applyCustomRange(): void {
    if (!this.canApplyCustomRange()) return;
    this.reloadAnalytics();
  }

  protected canApplyCustomRange(): boolean {
    const from = this.customFrom();
    const to = this.customTo();
    return !!from && !!to && from <= to;
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

  protected occupancyBarHeight(intensity: number): number {
    const analytics = this.store.analytics();
    if (!analytics || analytics.occupancyByHour.length === 0) return 0;

    const max = Math.max(...analytics.occupancyByHour.map((p) => p.intensity));
    if (max <= 0) return 0;

    return Math.max(10, (intensity / max) * 100);
  }

  protected occupancyTooltip(hour: string, intensity: number): string {
    return `${hour} - ${(intensity * 100).toFixed(1)}% occupancy`;
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
    if (analytics.weeklyTrends.length === 1) return `140,${this.weeklyPointY(analytics.weeklyTrends[0].value)}`;

    const points = analytics.weeklyTrends;
    const w = 280;
    const step = w / (points.length - 1);

    return points
      .map((p, i) => `${i * step},${this.weeklyPointY(p.value)}`)
      .join(' ');
  }

  protected weeklyPointX(index: number, total: number): number {
    if (total <= 1) return 140;
    return index * (280 / (total - 1));
  }

  protected weeklyPointY(value: number): number {
    const analytics = this.store.analytics();
    if (!analytics || analytics.weeklyTrends.length === 0) return 80;

    const values = analytics.weeklyTrends.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const chartHeight = 80;
    const topPadding = 8;
    const bottomPadding = 10;
    const drawableHeight = chartHeight - topPadding - bottomPadding;

    if (max <= min) {
      return chartHeight / 2;
    }

    const normalized = (value - min) / (max - min);
    return chartHeight - bottomPadding - normalized * drawableHeight;
  }

  protected shouldShowHourLabel(index: number, total: number): boolean {
    if (total <= 8) return true;
    return index === 0 || index === 6 || index === 12 || index === 18 || index === total - 1;
  }

  private reloadAnalytics(): void {
    const period = this.selectedPeriod();
    this.store.loadAnalytics(
      period,
      period === 'custom' ? this.customFrom() : null,
      period === 'custom' ? this.customTo() : null,
    );
  }

  private formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

