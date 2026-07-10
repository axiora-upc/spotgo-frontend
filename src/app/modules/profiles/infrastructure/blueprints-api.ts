import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Blueprint } from '../domain/model/blueprint.entity';
import { BlueprintsApiEndpoint } from './blueprints-api-endpoint';
import { BlueprintAssembler } from './blueprint-assembler';
import { BlueprintResource, DetectedSpotResource } from './blueprint-response';
import { DetectedSpot } from '../domain/model/detected-spot.entity';

interface ParkingResource {
  id: string;
  city: string;
  pricePerHour: number;
}

interface ParkingUpdateResource {
  totalSpaces?: number;
  availableSpaces?: number;
  totalFloors?: number;
  city?: string;
  pricePerHour?: number;
}

@Injectable({ providedIn: 'root' })
export class BlueprintsApi {
  private readonly blueprintsEndpoint: BlueprintsApiEndpoint;
  private readonly assembler = new BlueprintAssembler();
  private readonly spotsUrl = `${environment.apiUrl}/detectedSpots`;

  constructor(private readonly http: HttpClient) {
    this.blueprintsEndpoint = new BlueprintsApiEndpoint(http);
  }

  getBlueprints(): Observable<Blueprint[]> {
    return this.blueprintsEndpoint.getAll();
  }

  addBlueprint(blueprint: Blueprint): Observable<Blueprint> {
    return this.blueprintsEndpoint.create(blueprint).pipe(
      switchMap(created => {
        if (!blueprint.spots?.length) return of(created);
        const spotPosts = blueprint.spots.map((s, i) =>
          this.http.post<DetectedSpotResource>(this.spotsUrl, {
            id:          crypto.randomUUID(),
            code:        i + 1,
            blueprintId: created.id,
            parkingId:   created.parkingId,
            row:         s.row,
            col:         s.col,
            x_pct:       s.x_pct,
            y_pct:       s.y_pct,
            w_pct:       s.w_pct,
            h_pct:       s.h_pct,
            status:      'available',
          } satisfies DetectedSpotResource).pipe(catchError(() => of(null)))
        );
        return forkJoin(spotPosts).pipe(map(() => created));
      })
    );
  }

  removeBlueprint(id: string): Observable<void> {
    return this.blueprintsEndpoint.delete(id);
  }

  getBlueprintByParkingId(parkingId: string): Observable<Blueprint | null> {
    return this.http
      .get<BlueprintResource[]>(`${environment.apiUrl}/blueprints?parkingId=${parkingId}`)
      .pipe(
        switchMap(list => {
          if (list.length === 0) return of(null);
          const bpResource = list[0];
          return this.http
            .get<DetectedSpotResource[]>(`${this.spotsUrl}?blueprintId=${bpResource.id}`)
            .pipe(
              map(spotResources => {
                const blueprint = this.assembler.toEntityFromResource(bpResource);
                blueprint.spots = spotResources
                  .sort((a, b) => a.code - b.code)
                  .map(sr => ({
                    id:     sr.id,
                    code:   sr.code,
                    parkingId: sr.parkingId,
                    row:    sr.row,
                    col:    sr.col,
                    x_pct: sr.x_pct,
                    y_pct: sr.y_pct,
                    w_pct: sr.w_pct,
                    h_pct: sr.h_pct,
                    status: (sr.status ?? 'available') as DetectedSpot['status'],
                    assignedEmployeeId: sr.assignedEmployeeId ?? null,
                    assignedEmployeeName: sr.assignedEmployeeName ?? null,
                  }));
                return blueprint;
              })
            );
        }),
        catchError(() => of(null))
      );
  }

  updateSpotStatus(spotId: string, status: NonNullable<DetectedSpot['status']>): Observable<void> {
    return this.http.patch<void>(`${this.spotsUrl}/${spotId}/status`, null, {
      params: { status },
    });
  }

  getParking(parkingId: string): Observable<ParkingResource> {
    return this.http.get<ParkingResource>(`${environment.apiUrl}/parkings/${parkingId}`);
  }

  updateParkingStats(
    parkingId: string,
    stats: ParkingUpdateResource
  ): Observable<unknown> {
    return this.http.patch(`${environment.apiUrl}/parkings/${parkingId}`, stats).pipe(
      catchError(() => of(null))
    );
  }
}
