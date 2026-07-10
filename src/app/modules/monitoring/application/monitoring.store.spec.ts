import { Injector, runInInjectionContext } from '@angular/core';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MonitoringStore } from './monitoring.store';
import { MonitoringApi } from '../infrastructure/monitoring-api';
import { HistoryApi } from '../../parking/infrastructure/history-api';
import { PaymentApi } from '../../payment/infrastructure/payment-api';
import { PaymentStore } from '../../payment/application/payment.store';
import { CurrentUserService } from '../../../shared/services/current-user.service';
import { Reservation } from '../domain/model/reservation.entity';
import { ReservationRaw } from '../../parking/domain/model/reservation-raw.entity';

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: overrides.id ?? 'res-001',
    code: overrides.code ?? 'SPG-001',
    parkingId: overrides.parkingId ?? 'parking-001',
    spotId: overrides.spotId ?? 'A1',
    date: overrides.date ?? '2026-07-07',
    startTime: overrides.startTime ?? '12:00',
    duration: overrides.duration ?? 1.5,
    totalAmount: overrides.totalAmount ?? 9,
    baseAmount: overrides.baseAmount ?? 10,
    status: overrides.status ?? 'active',
  };
}

describe('MonitoringStore', () => {
  let injector: Injector;
  let store: MonitoringStore;

  const monitoringApiStub = {
    getParkings: vi.fn(),
    getDetectedSpots: vi.fn(),
  };

  const historyApiStub = {
    createReservation: vi.fn(),
    getReservations: vi.fn(),
    extendReservation: vi.fn(),
    setReservationStatus: vi.fn(),
  };

  const paymentApiStub = {
    addReceipt: vi.fn(),
    deleteReceiptByCode: vi.fn(),
  };

  const paymentStoreStub = {
    addToSavedThisMonth: vi.fn(),
    loadSubscriptionByClientId: vi.fn(),
    subtractFromSavedThisMonth: vi.fn(),
    currentDiscount: () => 10,
  };

  beforeEach(() => {
    Object.values(monitoringApiStub).forEach((spy) => spy.mockReset());
    Object.values(historyApiStub).forEach((spy) => spy.mockReset());
    Object.values(paymentApiStub).forEach((spy) => spy.mockReset());
    paymentStoreStub.addToSavedThisMonth.mockReset();
    paymentStoreStub.loadSubscriptionByClientId.mockReset();
    paymentStoreStub.subtractFromSavedThisMonth.mockReset();

    injector = Injector.create({
      providers: [
        { provide: MonitoringApi, useValue: monitoringApiStub, deps: [] },
        { provide: HistoryApi, useValue: historyApiStub, deps: [] },
        { provide: PaymentApi, useValue: paymentApiStub, deps: [] },
        { provide: PaymentStore, useValue: paymentStoreStub, deps: [] },
        { provide: CurrentUserService, useValue: { clientId: 'cli-001', adminId: '', parkingId: '' }, deps: [] },
      ],
    });

    store = runInInjectionContext(injector, () => new MonitoringStore());
    store['parkingsSignal'].set([{ id: 'parking-001', name: 'Main Parking' }] as any);
  });

  it('completeReservation should append the persisted reservation and savings only after creation succeeds', () => {
    const reservation = makeReservation();
    const onSuccess = vi.fn();
    const persisted = new ReservationRaw(
      reservation.id,
      'cli-001',
      reservation.parkingId,
      reservation.code,
      reservation.spotId,
      '2026-07-07T12:00:00.000-05:00',
      '2026-07-07T13:30:00.000-05:00',
      'active',
      reservation.totalAmount,
      reservation.baseAmount ?? reservation.totalAmount,
      null
    );

    historyApiStub.createReservation.mockReturnValue(of(persisted));
    paymentApiStub.addReceipt.mockReturnValue(of({}));

    store.completeReservation(reservation, { onSuccess });

    expect(historyApiStub.createReservation).toHaveBeenCalledWith(expect.objectContaining({
      startDate: '2026-07-07T12:00:00.000-05:00',
      endDate: '2026-07-07T13:30:00.000-05:00',
    }));

    expect(store.userReservations().length).toBe(1);
    expect(store.userReservations()[0].status).toBe('active');
    expect(paymentStoreStub.addToSavedThisMonth).toHaveBeenCalledTimes(1);
    expect(paymentStoreStub.addToSavedThisMonth).toHaveBeenCalledWith(1);
    expect(paymentApiStub.addReceipt).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('completeReservation should not mutate local reservations, receipts, or savings when creation fails', () => {
    const onError = vi.fn();
    historyApiStub.createReservation.mockReturnValue(throwError(() => new Error('boom')));

    store.completeReservation(makeReservation(), { onError });

    expect(store.userReservations()).toEqual([]);
    expect(paymentStoreStub.addToSavedThisMonth).not.toHaveBeenCalled();
    expect(paymentApiStub.addReceipt).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
