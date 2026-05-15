/*
  Assembler between ReservationRaw (domain) and ReservationRawResource (API DTO).

  toEntityFromResource is called by BaseApiEndpoint.getAll() for each item
  in the /reservations array response.

  toResourceFromEntity is called by BaseApiEndpoint.update() when the user
  rates a reservation. It sends the full reservation object back via PUT so
  json-server replaces the record with all fields intact, including the
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
      r.id,
      r.clientId,
      r.parkingId,
      r.code,
      r.spot,
      r.startDate,
      r.endDate,
      r.status,
      r.amount,
      /*
        r.rating ?? null normalises undefined → null.
        undefined happens when a reservation record in the DB was created
        before the rating field was added (old data without the field).
        The domain and the template always expect null | number, never undefined.
      */
      r.rating ?? null,
    );
  }

  /*
    Converts the entity back to a resource for PUT requests.
    All fields must be included so json-server does not lose data.
  */
  toResourceFromEntity(e: ReservationRaw): ReservationRawResource {
    return {
      id: e.id,
      clientId: e.clientId,
      parkingId: e.parkingId,
      code: e.code,
      spot: e.spot,
      startDate: e.startDate,
      endDate: e.endDate,
      status: e.status,
      amount: e.amount,
      rating: e.rating,
    };
  }

  toEntitiesFromResponse(response: ReservationRawResponse): ReservationRaw[] {
    return response.reservations.map(r => this.toEntityFromResource(r));
  }
}
