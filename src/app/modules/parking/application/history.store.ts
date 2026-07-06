/*
  HistoryStore is the application layer for the parking history feature.

  State design — two private raw signals + one computed join:

    rawReservationsSignal  → ReservationRaw[]      (from /reservations)
    parkingsSignal         → ParkingForHistory[]   (from /parkings)
    history (computed)     → ParkingHistory[]      (join, sorted newest first)

  Using a computed() for the join means that any write to either raw
  signal automatically triggers a re-derive of the history list.
  This eliminates manual synchronisation: when rateReservation() updates
  rawReservationsSignal, the view re-renders immediately without an
  extra HTTP call or explicit signal.set().

  Actions:
    loadHistoryByClientId(id)          → initial load (forkJoin)
    rateReservation(id, stars)         → PUT reservation + recalc + PUT parking
    submitReport(resId, pkId, type)    → POST /clientReports
*/
import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, retry } from 'rxjs';
import { ParkingHistory } from '../domain/model/parking-history.entity';
import { ParkingForHistory } from '../domain/model/parking-for-history.entity';
import { ReservationRaw } from '../domain/model/reservation-raw.entity';
import { ClientReport, ReportType } from '../domain/model/client-report.entity';
import { HistoryApi } from '../infrastructure/history-api';
import { CurrentUserService } from '../../../shared/services/current-user.service';

@Injectable({ providedIn: 'root' })
export class HistoryStore {
  private readonly historyApi   = inject(HistoryApi);
  private readonly currentUser  = inject(CurrentUserService);

  /* ── Private raw state ─────────────────────────────────────────────── */

  /*
    Raw reservations for the current client, loaded from /reservations.
    Writing this signal (on load or after rating) automatically updates
    the computed 'history' signal below.
  */
  private readonly rawReservationsSignal = signal<ReservationRaw[]>([]);
  private readonly allReservationsSignal = signal<ReservationRaw[]>([]);

  /*
    All parkings loaded from /parkings, kept in the store so that:
      (a) the join can look up parking names by parkingId
      (b) after a rating, the store can update the parking's average
          rating and persist it via PUT without re-fetching
  */
  private readonly parkingsSignal = signal<ParkingForHistory[]>([]);

  private readonly loadingSignal = signal(false);
  private readonly errorSignal   = signal<string | null>(null);

  /* ── Public readonly state ─────────────────────────────────────────── */

  readonly loading = this.loadingSignal.asReadonly();
  readonly error   = this.errorSignal.asReadonly();

  /*
    Derived signal: joins rawReservations with parkings by parkingId,
    filters to completed status, and sorts newest-first.

    computed() re-runs this function automatically whenever either
    rawReservationsSignal or parkingsSignal changes — no manual call needed.
  */
  readonly history = computed<ParkingHistory[]>(() => {
    const parkingMap = new Map(this.parkingsSignal().map(p => [p.id, p]));
    const now = Date.now();

    return this.rawReservationsSignal()
      .sort((a, b) => b.startDate.localeCompare(a.startDate)) // newest first
      .map(r => {
        const p = parkingMap.get(r.parkingId);
        const effectiveStatus =
          r.status === 'active' && new Date(r.endDate).getTime() <= now
            ? 'completed'
            : r.status;
        return new ParkingHistory(
          r.id,
          r.clientId,
          r.parkingId,
          p?.name       ?? r.parkingId,
          r.code,
          r.spot,
          r.startDate,
          r.endDate,
          effectiveStatus,
          r.amount,
          r.rating,
        );
      });
  });

  /* ── Actions ───────────────────────────────────────────────────────── */

  /*
    Called by the view on init, passing the logged-in client id.

    What happens:
      1. forkJoin fires GET /reservations and GET /parkings simultaneously
      2. Both respond → the store filters reservations by clientId
      3. Both signals are set → computed 'history' derives automatically
      4. The view re-renders with the joined list
  */
  loadHistoryByClientId(clientId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    forkJoin({
      reservations: this.historyApi.getReservations(),
      parkings:     this.historyApi.getParkings(),
    }).subscribe({
      next: ({ reservations, parkings }) => {
        this.allReservationsSignal.set(reservations);
        this.rawReservationsSignal.set(
          reservations.filter(r => r.clientId === clientId)
        );
        this.parkingsSignal.set(parkings);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to load history'));
        this.loadingSignal.set(false);
      },
    });
  }

  /*
    Called when the user confirms a star rating in the modal.

    What happens:
      1. Build an updated ReservationRaw with the new rating value
      2. PUT /reservations/:id to persist it
      3. Update rawReservationsSignal → computed 'history' re-derives instantly
      4. Recalculate the average rating for that parking from all rated
         reservations currently in rawReservationsSignal
      5. PUT /parkings/:id to persist the new average

    retry(1) retries each PUT once before propagating the error.
  */
  rateReservation(
    reservationId: string,
    stars: number,
    callbacks?: { onSuccess?: () => void; onError?: () => void }
  ): void {
    const raw = this.rawReservationsSignal().find(r => r.id === reservationId);
    if (!raw) return;

    /*
      ReservationRaw is immutable (all fields are readonly), so updating
      means constructing a new instance with the changed rating.
    */
    const updated = new ReservationRaw(
      raw.id, raw.clientId, raw.parkingId, raw.code, raw.spot,
      raw.startDate, raw.endDate, raw.status, raw.amount, raw.baseAmount, stars,
    );

    this.historyApi.rateReservation(updated).pipe(retry(1)).subscribe({
      next: (saved) => {
        /* Step 3: update raw signal → history computed re-derives */
        this.rawReservationsSignal.update(raws =>
          raws.map(r => r.id === reservationId ? saved : r)
        );
        this.allReservationsSignal.update(raws =>
          raws.map(r => r.id === reservationId ? saved : r)
        );

        /* Step 4: recalculate average across all rated reservations for this parking */
        const ratedForParking = this.allReservationsSignal()
          .filter(r => r.parkingId === raw.parkingId && r.rating !== null);

        const avg = ratedForParking.length === 0
          ? 0
          : ratedForParking.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratedForParking.length;
        const rounded = Math.round(avg * 10) / 10;

        /* Step 5: persist new average to the parking via PATCH (partial update) */
        const parking = this.parkingsSignal().find(p => p.id === raw.parkingId);
        if (!parking) {
          callbacks?.onSuccess?.();
          return;
        }

        /*
          We pass only parkingId + rounded average. HistoryApi sends PATCH
          with { rating } so backend merges it without touching any other
          parking field (adminId, totalSpaces, totalFloors, etc.).
        */
        this.historyApi.updateParkingRating(parking.id, rounded).pipe(retry(1)).subscribe({
          next: (savedParking) => {
            this.parkingsSignal.update(ps =>
              ps.map(p => p.id === parking.id ? savedParking : p)
            );
            callbacks?.onSuccess?.();
          },
          error: (err) => {
            this.errorSignal.set(this.formatError(err, 'Failed to update parking rating'));
            callbacks?.onError?.();
          },
        });
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to rate reservation'));
        callbacks?.onError?.();
      },
    });
  }

  /*
    Called when the user confirms a report submission.

    Creates a ClientReport entity and POSTs it to /clientReports.
    The local history list does not change — only a new report is created.

    The date is always today (the moment the client submits the report).
  */
  submitReport(
    reservationId: string,
    parkingId: string,
    type: ReportType,
    callbacks?: { onSuccess?: () => void; onError?: () => void }
  ): void {
    const today = new Date().toISOString();

    const report = new ClientReport(
      '',            // id assigned by backend on POST
      '',            // code assigned by backend on POST
      this.currentUser.clientId,
      parkingId,
      reservationId,
      type,
      today,
      'submitted',
    );

    this.historyApi.submitReport(report).subscribe({
      next: () => callbacks?.onSuccess?.(),
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to submit report'));
        callbacks?.onError?.();
      },
    });
  }

  private formatError(err: unknown, fallback: string): string {
    if (err instanceof Error) return err.message;
    return fallback;
  }
}
