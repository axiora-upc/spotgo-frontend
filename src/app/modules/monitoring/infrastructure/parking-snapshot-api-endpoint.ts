/*
  Endpoint for the /parkingSnapshot singleton resource.

  Unlike employees / incidents this resource is NOT a collection, so
  the CRUD inherited from BaseApiEndpoint does not apply. We declare
  it as a plain class that owns its own HttpClient calls but still
  reuses the assembler for the domain <-> resource mapping.

  The two methods exposed are:
  - get()              GET the full snapshot
  - touchLastUpdated() read current facility, override lastUpdated,
                       PATCH the merged facility back. This preserves
                       the other facility fields that JSON Server
                       would otherwise lose during a partial merge.
*/
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { ParkingSnapshot } from '../domain/model/parking-spot.entity';
import { ParkingSnapshotResource } from './parking-snapshot-response';
import { ParkingSnapshotAssembler } from './parking-snapshot-assembler';

export class ParkingSnapshotApiEndpoint {
  private readonly endpointUrl = 'http://localhost:3000/parkingSnapshot';
  private readonly assembler = new ParkingSnapshotAssembler();

  constructor(private readonly http: HttpClient) {}

  /*
    Reads the singleton snapshot and returns it as a domain entity.
  */
  get(): Observable<ParkingSnapshot> {
    return this.http.get<ParkingSnapshotResource>(this.endpointUrl).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) =>
        throwError(() => new Error('Failed to load parking snapshot: ' + err?.message))
      )
    );
  }

  /*
    Read-modify-write of facility.lastUpdated.

    JSON Server PATCH on a singleton replaces nested objects entirely,
    so we GET the current state, build the full facility with the new
    lastUpdated, and PATCH that back. JSON Server then replaces the
    facility key but with all fields intact.
  */
  touchLastUpdated(): Observable<ParkingSnapshot> {
    const now = new Date();
    const lastUpdated = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((part) => part.toString().padStart(2, '0'))
      .join(':');

    return this.get().pipe(
      switchMap((current) => {
        const facilityResource = this.assembler.toResourceFromEntity(current).facility;
        facilityResource.lastUpdated = lastUpdated;

        return this.http
          .patch<ParkingSnapshotResource>(this.endpointUrl, { facility: facilityResource })
          .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
      }),
      catchError((err) =>
        throwError(
          () => new Error('Failed to update parking snapshot: ' + err?.message)
        )
      )
    );
  }
}
