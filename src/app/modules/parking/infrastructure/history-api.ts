/*
  HistoryApi is the single entry point for all HTTP operations in the
  parking history feature.

  The store (HistoryStore) is the only class that talks to HistoryApi.
  It never touches the endpoints directly.

  Operations exposed:
    getReservations()       → GET  /reservations        → ReservationRaw[]
    getParkings()           → GET  /parkings             → ParkingForHistory[]
    rateReservation(r)      → PUT  /reservations/:id     → ReservationRaw
    updateParkingRating(p)  → PUT  /parkings/:id         → ParkingForHistory
    submitReport(r)         → POST /clientReports        → ClientReport

  HistoryStore calls getReservations() and getParkings() simultaneously
  via forkJoin, then joins them by parkingId to build ParkingHistory[].
  When the user rates a session, the store calls rateReservation() first,
  recalculates the average, then calls updateParkingRating() to persist it.
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReservationRaw } from '../domain/model/reservation-raw.entity';
import { ParkingForHistory } from '../domain/model/parking-for-history.entity';
import { ClientReport } from '../domain/model/client-report.entity';
import { ReservationsApiEndpoint } from './reservations-api-endpoint';
import { ParkingsHistoryApiEndpoint } from './parkings-history-api-endpoint';
import { ClientReportsApiEndpoint } from './client-reports-api-endpoint';

@Injectable({ providedIn: 'root' })
export class HistoryApi {
  private readonly reservationsEndpoint: ReservationsApiEndpoint;
  private readonly parkingsEndpoint: ParkingsHistoryApiEndpoint;
  private readonly reportsEndpoint: ClientReportsApiEndpoint;

  constructor(http: HttpClient) {
    this.reservationsEndpoint = new ReservationsApiEndpoint(http);
    this.parkingsEndpoint     = new ParkingsHistoryApiEndpoint(http);
    this.reportsEndpoint      = new ClientReportsApiEndpoint(http);
  }

  /*
    Returns the full reservations list. HistoryStore filters by clientId
    after loading, following the same pattern used in PaymentStore.
  */
  getReservations(): Observable<ReservationRaw[]> {
    return this.reservationsEndpoint.getAll();
  }

  /*
    Returns all parkings so the store can join them with reservations
    by parkingId and look up parking names for display.
  */
  getParkings(): Observable<ParkingForHistory[]> {
    return this.parkingsEndpoint.getAll();
  }

  /*
    Persists only the updated rating to the reservation via PATCH.
  */
  rateReservation(reservationId: string, rating: number): Observable<ReservationRaw> {
    return this.reservationsEndpoint.patchRating(reservationId, rating);
  }

  /*
    Generic reservation update via PUT.
  */
  updateReservation(reservation: ReservationRaw): Observable<ReservationRaw> {
    return this.reservationsEndpoint.update(reservation, reservation.id);
  }

  extendReservation(
    reservationId: string,
    details: { endDate: string; amount: number; baseAmount?: number; status?: string }
  ): Observable<ReservationRaw> {
    return this.reservationsEndpoint.patchDetails(reservationId, details);
  }

  /*
    Persists only the updated rating to the parking via PATCH.
    PATCH sends { rating } and backend merges it with the existing
    document, leaving all other fields (adminId, totalSpaces, etc.) intact.
    This replaces the previous PUT approach which was deleting those fields.
  */
  updateParkingRating(parkingId: string, rating: number): Observable<ParkingForHistory> {
    return this.parkingsEndpoint.patchRating(parkingId, rating);
  }

  /*
    Creates a new reservation in the database via POST.
  */
  createReservation(reservation: ReservationRaw): Observable<ReservationRaw> {
    return this.reservationsEndpoint.create(reservation);
  }

  /*
    Hard-deletes a reservation. Keep only for internal/admin cleanup if needed.
  */
  deleteReservation(id: string): Observable<void> {
    return this.reservationsEndpoint.delete(id);
  }

  /*
    Updates only the status field of a reservation via PATCH.
    Used to transition lifecycle: 'active' → 'completed' (expired) or 'cancelled'.
    The record stays in the DB so History always shows all sessions.
  */
  setReservationStatus(id: string, status: string): Observable<ReservationRaw> {
    return this.reservationsEndpoint.patchStatus(id, status);
  }

  /*
    Creates a new client report via POST /clientReports.
    backend assigns the id and returns the saved record.
  */
  submitReport(report: ClientReport): Observable<ClientReport> {
    return this.reportsEndpoint.create(report);
  }

  /*
    Returns all client-submitted reports. Admin views filter by parkingId.
  */
  getClientReports(): Observable<ClientReport[]> {
    return this.reportsEndpoint.getAll();
  }

  /*
    Updates only a report status, keeping the record visible for audit.
  */
  updateClientReportStatus(id: string | number, status: string): Observable<ClientReport> {
    return this.reportsEndpoint.patchStatus(id, status);
  }
}
