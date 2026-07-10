/*
  Handles all HTTP calls to /reservations.

  Inherits getAll() and update() from BaseApiEndpoint:
    getAll()           → GET  /reservations         → ReservationRaw[]
    update(entity, id) → PUT  /reservations/:id     → ReservationRaw
      (used when the client rates a reservation — sends the full
       reservation object with the new rating value)
*/
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { ReservationRaw } from '../domain/model/reservation-raw.entity';
import { ReservationRawResource, ReservationRawResponse } from './reservation-raw-response';
import { ReservationRawAssembler } from './reservation-raw-assembler';

export class ReservationsApiEndpoint extends BaseApiEndpoint<
  ReservationRaw,
  ReservationRawResource,
  ReservationRawResponse,
  ReservationRawAssembler
> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/reservations`, new ReservationRawAssembler());
  }

  patchRating(id: string, rating: number): Observable<ReservationRaw> {
    return this.http.patch<ReservationRawResource>(`${this.endpointUrl}/${id}`, { rating }).pipe(
      map(resource => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to update reservation rating'))
    );
  }

  patchDetails(
    id: string,
    details: { endDate: string; status?: string }
  ): Observable<ReservationRaw> {
    return this.http.patch<ReservationRawResource>(`${this.endpointUrl}/${id}`, details).pipe(
      map(resource => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to update reservation details'))
    );
  }

  patchStatus(id: string, status: string): Observable<ReservationRaw> {
    return this.http.patch<ReservationRawResource>(`${this.endpointUrl}/${id}`, { status }).pipe(
      map(resource => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to update reservation status'))
    );
  }
}
