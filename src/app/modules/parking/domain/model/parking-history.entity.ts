/*
  ParkingHistory is the rich view entity that the HistoryComponent consumes.

  It is NOT fetched directly from any endpoint. HistoryStore builds it by
  joining two API responses:

    GET /reservations → ReservationRaw[] (booking data, rating)
    GET /parkings     → ParkingForHistory[] (parking name)

  SQL equivalent:
    SELECT r.*, p.name AS parkingName
    FROM reservations r
    JOIN parkings p ON r.parkingId = p.id
    WHERE r.clientId = 'cli-001'
    ORDER BY r.startDate DESC

  The join is automatic: HistoryStore uses a computed() that re-derives
  this list whenever either rawReservations or parkings signals change.
  This means a rating update triggers an immediate re-render with no
  extra HTTP call.

  Unlike ReservationRaw and ParkingForHistory, this class does NOT
  implement BaseEntity — it is never sent to or received from the API.
*/
export class ParkingHistory {
  constructor(
    public readonly id: string,           // reservation id
    public readonly clientId: string,
    public readonly parkingId: string,
    public readonly parkingName: string,  // joined from ParkingForHistory
    public readonly code: string,
    public readonly spot: string,
    public readonly startDate: string,    // ISO 8601
    public readonly endDate: string,      // ISO 8601
    public readonly status: string,
    public readonly amount: number,
    public readonly rating: number | null, // null = not rated yet
  ) {}
}
