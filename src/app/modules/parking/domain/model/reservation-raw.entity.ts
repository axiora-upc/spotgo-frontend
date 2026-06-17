/*
  ReservationRaw is the domain entity that maps 1-to-1 with what the
  /reservations endpoint returns.

  It carries all the fields of a completed parking session:
    - who made it (clientId)
    - where (parkingId — foreign key to the parkings collection)
    - booking details (code, spot, dates, amount)
    - whether the client has rated it (rating — null if not yet rated)

  It does NOT know the parking's name. That comes from a separate
  /parkings call. HistoryStore joins both to produce ParkingHistory,
  which is what the view consumes.

  It implements BaseEntity so BaseApiEndpoint can work with it as a
  typed entity.
*/
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export class ReservationRaw implements BaseEntity {
  /*
    Public readonly fields are used instead of private + getters because
    ReservationRaw is an intermediate entity — it is only used inside
    HistoryStore to build the join and to persist updates (rateReservation).
    It is never mutated after construction; updates create a new instance.
  */
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly parkingId: string,   // foreign key → parkings collection
    public readonly code: string,        // booking reference e.g. "SPG-A1B2C3"
    public readonly spot: string,        // e.g. "L1-08"
    public readonly startDate: string,   // ISO 8601
    public readonly endDate: string,     // ISO 8601
    public readonly status: string,
    public readonly amount: number,      // discounted amount paid by client
    public readonly baseAmount: number,  // full amount earned by the parking
    public readonly rating: number | null, // null = not yet rated by this client
  ) {}
}
