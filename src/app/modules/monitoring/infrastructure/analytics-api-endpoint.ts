/*
  AnalyticsApiEndpoint orquesta las llamadas HTTP que necesita la vista Analytics.

  En vez de leer datos estáticos de una colección "parkingSpots" que no existe
  en el backend real, todos los KPIs se computan en tiempo real:

  - totalRevenue     → suma de baseAmount de reservations no canceladas (igual al real-time map)
  - systemStatus     → 'maintenance' si hay algún detectedSpot en mantenimiento, 'active' si no
  - mostUtilizedSpots → reservations agrupadas por spot code, ordenadas por frecuencia
  - peakHour         → hora con mayor intensidad según occupancyByHour
*/
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  OccupancyPoint,
  ParkingAnalytics,
  SpotUtilization,
  WeeklyTrendPoint,
} from '../domain/model/analytics.entity';
import {
  AnalyticsResource,
} from './analytics-response';

export class AnalyticsApiEndpoint {
  private readonly analyticsUrl = `${environment.apiUrl}/analytics`;

  constructor(private readonly http: HttpClient) {}

  getByPeriod(period: 'today' | 'last7' | 'custom', from?: string | null, to?: string | null): Observable<ParkingAnalytics> {
    let params = new HttpParams().set('period', period);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    return this.http.get<AnalyticsResource>(this.analyticsUrl, { params }).pipe(
      map((resource) => {
        const analytics = new ParkingAnalytics({
          parkingId: resource.id,
          parkingName: resource.name,
          averageOccupancy: resource.averageOccupancy,
          occupancyTrendPercent: resource.occupancyTrendPercent ?? 0,
          peakHour: resource.peakHour,
          totalRevenue: resource.totalRevenue,
          revenueTrendPercent: resource.revenueTrendPercent ?? 0,
          systemStatus: resource.systemStatus,
          totalCapacity: resource.totalCapacity ?? resource.totalSpaces,
          efficiencyIndex: resource.efficiencyIndex ?? 0,
          occupancyByHour: resource.occupancyByHour.map((p) => new OccupancyPoint({ hour: p.hour, intensity: p.intensity })),
          weeklyTrends: resource.weeklyTrends.map((p) => new WeeklyTrendPoint({ day: p.day, value: p.value })),
          mostUtilizedSpots: resource.mostUtilizedSpots.map((spot) => new SpotUtilization({
            id: spot.id,
            spotId: spot.spotId,
            spotName: spot.spotName,
            zone: spot.zone,
            type: spot.type as 'standard' | 'ev',
            status: spot.status as 'available' | 'occupied' | 'maintenance',
            dailyTurnover: spot.dailyTurnover,
            peakUtilization: spot.peakUtilization,
            revenueImpact: spot.revenueImpact,
          })),
          maintenanceSpotsCount: resource.maintenanceSpotsCount ?? 0,
        });

        return analytics;
      }),
      catchError(err =>
        throwError(() => new Error('Failed to load analytics: ' + (err?.message ?? '')))
      )
    );
  }
}
