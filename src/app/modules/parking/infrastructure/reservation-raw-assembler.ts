/*
  Assembler between ReservationRaw (domain) and ReservationRawResource (API DTO).

  toEntityFromResource is called by BaseApiEndpoint.getAll() for each item
  in the /reservations array response.

  toResourceFromEntity is called by BaseApiEndpoint.update() when the user
  rates a reservation. It sends the full reservation object back via PUT so
  backend replaces the record with all fields intact, including the
  newly set rating.
*/
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { ReservationRaw } from '../domain/model/reservation-raw.entity';
import { ReservationRawResource, ReservationRawResponse } from './reservation-raw-response';

export class ReservationRawAssembler
  implements BaseAssembler<ReservationRaw, ReservationRawResource, ReservationRawResponse>
{
  toEntityFromResource(r: ReservationRawResource): ReservationRaw {
    return new ReservationRaw(
      r.id ?? '',
      r.clientId ?? '',
      r.parkingId,
      r.code ?? '',
      r.spot,
      r.startDate,
      r.endDate,
      r.status ?? 'active',
      r.amount ?? 0,
      r.baseAmount ?? r.amount ?? 0,
      r.rating ?? null,
    );
  }

  toResourceFromEntity(e: ReservationRaw): ReservationRawResource {
    return {
      parkingId: e.parkingId,
      spot: e.spot,
      startDate: e.startDate,
      endDate: e.endDate,
    } as ReservationRawResource;
  }

  toEntitiesFromResponse(response: ReservationRawResponse): ReservationRaw[] {
    return response.reservations.map(r => this.toEntityFromResource(r));
  }
}
