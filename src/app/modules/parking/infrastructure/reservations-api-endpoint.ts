/*
  Handles all HTTP calls to /reservations.

  Inherits getAll() and update() from BaseApiEndpoint:
    getAll()           → GET  /reservations         → ReservationRaw[]
    update(entity, id) → PUT  /reservations/:id     → ReservationRaw
      (used when the client rates a reservation — sends the full
       reservation object with the new rating value)
*/
import { HttpClient } from '@angular/common/http';
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
}
