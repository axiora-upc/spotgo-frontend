import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApi } from '../../../shared/infrastructure/base-api';
import { Blueprint } from '../domain/model/blueprint.entity';
import { BlueprintsApiEndpoint } from './blueprints-api-endpoint';
import { BlueprintAssembler } from './blueprint-assembler';
import { BlueprintResource, DetectedSpotResource } from './blueprint-response';
import { DetectedSpot } from '../domain/model/detected-spot.entity';

@Injectable({ providedIn: 'root' })
export class BlueprintsApi extends BaseApi {
  private readonly blueprintsEndpoint: BlueprintsApiEndpoint;
  private readonly assembler = new BlueprintAssembler();
  private readonly spotsUrl = `${environment.apiUrl}/detectedSpots`;

  constructor(private readonly http: HttpClient) {
    super();
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
            id:          `${created.id}__r${s.row}c${s.col}`,
            localId:     i + 1,
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
                  .sort((a, b) => a.localId - b.localId)
                  .map(sr => ({
                    id:     Number(sr.id),
                    row:    sr.row,
                    col:    sr.col,
                    x_pct: sr.x_pct,
                    y_pct: sr.y_pct,
                    w_pct: sr.w_pct,
                    h_pct: sr.h_pct,
                    status: (sr.status ?? 'available') as DetectedSpot['status'],
                  }));
                return blueprint;
              })
            );
        }),
        catchError(() => of(null))
      );
  }

  patchBlueprintSpots(blueprintId: string, spots: DetectedSpot[]): Observable<unknown> {
    const patches = spots.map(s =>
      this.http
        .patch(`${this.spotsUrl}/${s.id}/status`, null, {
          params: { status: s.status ?? 'available' },
        })
        .pipe(catchError(() => of(null)))
    );
    return forkJoin(patches).pipe(catchError(() => of(null)));
  }

  updateParkingStats(
    parkingId: string,
    stats: { totalSpaces: number; availableSpaces: number; totalFloors: number }
  ): Observable<unknown> {
    return this.http.patch(`${environment.apiUrl}/parkings/${parkingId}`, stats).pipe(
      catchError(() => of(null))
    );
  }
}
