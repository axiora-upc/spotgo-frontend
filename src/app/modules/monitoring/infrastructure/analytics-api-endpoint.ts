/*
  AnalyticsApiEndpoint orquesta las llamadas HTTP que necesita la vista Analytics.

  En vez de leer datos estáticos de una colección "parkingSpots" que no existe
  en el backend real, todos los KPIs se computan en tiempo real:

  - totalRevenue     → suma de baseAmount de reservations no canceladas (igual al real-time map)
  - systemStatus     → 'maintenance' si hay algún detectedSpot en mantenimiento, 'active' si no
  - mostUtilizedSpots → reservations agrupadas por spot code, ordenadas por frecuencia
  - peakHour         → hora con mayor intensidad según occupancyByHour
*/
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  OccupancyPoint,
  ParkingAnalytics,
  SpotStatus,
  SpotType,
  SpotUtilization,
  WeeklyTrendPoint,
} from '../domain/model/analytics.entity';
import {
  OccupancyPointResource,
  ParkingResource,
  WeeklyTrendPointResource,
} from './analytics-response';
import { ParkingAnalyticsAssembler } from './parking-analytics-assembler';

interface ReservationResource {
  id: string;
  parkingId: string;
  spot: string;
  status: string;
  amount: number;
  baseAmount: number;
}

interface DetectedSpotResource {
  id: string;
  parkingId: string;
  row: number;
  col: number;
  status?: string;
}

export class AnalyticsApiEndpoint {
  private readonly parkingUrl      = `${environment.apiUrl}/parkings`;
  private readonly occupancyUrl    = `${environment.apiUrl}/occupancyByHour`;
  private readonly trendsUrl       = `${environment.apiUrl}/weeklyTrends`;
  private readonly reservationsUrl = `${environment.apiUrl}/reservations`;
  private readonly spotsUrl        = `${environment.apiUrl}/detectedSpots`;
  private readonly parkingAssembler = new ParkingAnalyticsAssembler();

  constructor(private readonly http: HttpClient) {}

  getByParkingId(parkingId: string): Observable<ParkingAnalytics> {
    const parking$      = this.http.get<ParkingResource>(`${this.parkingUrl}/${parkingId}`);
    const occupancy$    = this.http.get<OccupancyPointResource[]>(`${this.occupancyUrl}?parkingId=${parkingId}`);
    const trends$       = this.http.get<WeeklyTrendPointResource[]>(`${this.trendsUrl}?parkingId=${parkingId}`);
    const reservations$ = this.http.get<ReservationResource[]>(`${this.reservationsUrl}?parkingId=${parkingId}`);
    const spots$        = this.http.get<DetectedSpotResource[]>(`${this.spotsUrl}?parkingId=${parkingId}`);

    return forkJoin([parking$, occupancy$, trends$, reservations$, spots$]).pipe(
      map(([parkingResource, occupancyPoints, trendPoints, reservations, detectedSpots]) => {

        // ── Revenue: misma fórmula que el real-time map ─────────────────────
        const totalRevenue = Math.round(
          reservations
            .filter(r => r.status !== 'cancelled')
            .reduce((sum, r) => sum + r.baseAmount, 0) * 100
        ) / 100;

        // ── Salud del sistema: derivada de spots en mantenimiento ────────────
        const maintenanceSpotsCount = detectedSpots.filter(s => s.status === 'maintenance').length;
        const systemStatus = maintenanceSpotsCount > 0 ? 'maintenance' : 'active';

        // ── Hora pico: el punto de mayor intensidad en occupancyByHour ───────
        const peakHour = occupancyPoints.length > 0
          ? occupancyPoints.reduce((max, p) => p.intensity > max.intensity ? p : max, occupancyPoints[0]).hour
          : parkingResource.peakHour;

        // ── Espacios más utilizados: agrupados desde reservations ─────────────
        // Construir mapa spot-code → { count, revenue }
        const spotMap = new Map<string, { count: number; revenue: number }>();
        reservations
          .filter(r => r.status !== 'cancelled')
          .forEach(r => {
            const cur = spotMap.get(r.spot) ?? { count: 0, revenue: 0 };
            spotMap.set(r.spot, {
              count:   cur.count + 1,
              revenue: Math.round((cur.revenue + r.baseAmount) * 100) / 100,
            });
          });

        // Lookup de estado actual por código de spot (row/col → "A1", "B3", etc.)
        const statusByCode = new Map<string, string>();
        detectedSpots.forEach(s => {
          const code = `${String.fromCharCode(65 + s.row)}${s.col + 1}`;
          statusByCode.set(code, s.status ?? 'available');
        });

        const maxCount = spotMap.size > 0
          ? Math.max(...Array.from(spotMap.values()).map(v => v.count))
          : 1;

        const mostUtilizedSpots: SpotUtilization[] = Array.from(spotMap.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .map(([spotCode, stats], idx) => new SpotUtilization({
            id:             `su-${idx + 1}`,
            spotId:         spotCode,
            spotName:       spotCode,
            zone:           `Level ${spotCode.charAt(0)}`,
            type:           'standard' as SpotType,
            status:         (statusByCode.get(spotCode) ?? 'available') as SpotStatus,
            dailyTurnover:  stats.count,
            peakUtilization: Math.round((stats.count / maxCount) * 100),
            revenueImpact:  stats.revenue,
          }));

        // ── Ensamblar la entidad ──────────────────────────────────────────────
        const analytics = this.parkingAssembler.toEntityFromResource({
          ...parkingResource,
          totalRevenue,
          systemStatus,
          peakHour,
        });

        analytics.maintenanceSpotsCount = maintenanceSpotsCount;
        analytics.mostUtilizedSpots     = mostUtilizedSpots;
        analytics.occupancyByHour       = occupancyPoints.map(p =>
          new OccupancyPoint({ hour: p.hour, intensity: p.intensity })
        );
        analytics.weeklyTrends          = trendPoints.map(p =>
          new WeeklyTrendPoint({ day: p.day, value: p.value })
        );

        return analytics;
      }),
      catchError(err =>
        throwError(() => new Error('Failed to load analytics: ' + (err?.message ?? '')))
      )
    );
  }
}
