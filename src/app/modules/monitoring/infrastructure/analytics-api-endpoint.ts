/*
  AnalyticsApiEndpoint orquesta las dos llamadas HTTP que necesita
  la vista Analytics:

  1. GET /parkings/:parkingId  → datos del parking (KPIs, gráficos)
  2. GET /spotUtilization?parkingId=:id → spots más utilizados

  Ambas llamadas se hacen en paralelo con forkJoin y el resultado se
  fusiona en una sola entidad ParkingAnalytics antes de entregársela
  al Store.

  No extiende BaseApiEndpoint porque este endpoint no es una colección
  estándar: combina dos fuentes distintas y siempre devuelve un único
  agregado.
*/
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ParkingAnalytics } from '../domain/model/analytics.entity';
import { ParkingResource, SpotUtilizationResource } from './analytics-response';
import { ParkingAnalyticsAssembler } from './parking-analytics-assembler';
import { SpotUtilizationAssembler } from './spot-utilization-assembler';

export class AnalyticsApiEndpoint {
  private readonly parkingUrl     = `${environment.apiUrl}/parkings`;
  private readonly spotsUrl       = `${environment.apiUrl}/spotUtilization`;
  private readonly parkingAssembler = new ParkingAnalyticsAssembler();
  private readonly spotAssembler    = new SpotUtilizationAssembler();

  constructor(private readonly http: HttpClient) {}

  /*
    Obtiene el agregado completo de analytics para un parking.

    forkJoin espera a que ambas peticiones terminen y emite un único
    valor con los dos resultados. Luego se fusionan en la entidad
    ParkingAnalytics que consume el Store.

    El filtro ?parkingId= lo soporta json-server de forma nativa.
  */
  getByParkingId(parkingId: string): Observable<ParkingAnalytics> {
    const parking$ = this.http.get<ParkingResource>(
      `${this.parkingUrl}/${parkingId}`
    );

    const spots$ = this.http.get<SpotUtilizationResource[]>(
      `${this.spotsUrl}?parkingId=${parkingId}`
    );

    return forkJoin([parking$, spots$]).pipe(
      map(([parkingResource, spotResources]) => {
        /* Convierte el parking resource en la entidad de dominio */
        const analytics = this.parkingAssembler.toEntityFromResource(parkingResource);

        /* Inyecta los spots en el mismo agregado */
        analytics.mostUtilizedSpots = spotResources.map((s) =>
          this.spotAssembler.toEntityFromResource(s)
        );

        return analytics;
      }),
      catchError((err) =>
        throwError(
          () => new Error('Failed to load analytics: ' + (err?.message ?? ''))
        )
      )
    );
  }
}
