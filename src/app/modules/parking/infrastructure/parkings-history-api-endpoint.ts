/*
  Handles all HTTP calls to /parkings within the history context.

  Inherits getAll() from BaseApiEndpoint:
    getAll() → GET /parkings → ParkingForHistory[]
      (used on load to build the join with reservations)

  Adds a custom patchRating() method that uses PATCH instead of PUT:
    PATCH /parkings/:id { rating: N }
      PATCH sends only the changed field, so json-server merges it with
      the existing document. This preserves all other parking fields
      (adminId, totalSpaces, totalFloors, etc.) that ParkingForHistory
      does not carry.

      PUT would replace the entire document with only the 6 fields we
      know about, permanently deleting the admin-only fields from db.json.
*/
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { ParkingForHistory } from '../domain/model/parking-for-history.entity';
import { ParkingForHistoryResource, ParkingForHistoryResponse } from './parking-for-history-response';
import { ParkingForHistoryAssembler } from './parking-for-history-assembler';

export class ParkingsHistoryApiEndpoint extends BaseApiEndpoint<
  ParkingForHistory,
  ParkingForHistoryResource,
  ParkingForHistoryResponse,
  ParkingForHistoryAssembler
> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/parkings`, new ParkingForHistoryAssembler());
  }

  /*
    Sends PATCH /parkings/:id with only { rating } in the body.
    json-server merges this with the existing document, so every
    other field (adminId, totalSpaces, city, etc.) is left untouched.

    http, endpointUrl, assembler and handleError are all protected
    members inherited from BaseApiEndpoint, so they are accessible here.
  */
  patchRating(id: string, rating: number): Observable<ParkingForHistory> {
    return this.http
      .patch<ParkingForHistoryResource>(`${this.endpointUrl}/${id}`, { rating })
      .pipe(
        map(r => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError('Failed to patch parking rating')),
      );
  }
}
