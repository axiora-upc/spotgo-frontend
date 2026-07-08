import { Injector, runInInjectionContext } from '@angular/core';
import { throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaymentStore } from './payment.store';
import { PaymentApi } from '../infrastructure/payment-api';
import { Subscription } from '../domain/model/subscription.entity';
import { CurrentUserService } from '../../../shared/services/current-user.service';

function makeSubscription(overrides: Partial<{
  planId: string;
  autoRenewal: boolean;
  paymentMethodLastFour: string;
  paymentMethodExpiry: string;
  pricePerMonth: number;
}> = {}): Subscription {
  return new Subscription({
    id: 'sub-001',
    clientId: 'cli-001',
    planId: overrides.planId ?? 'free',
    status: 'active',
    renewsOn: '2026-08-01',
    pricePerMonth: overrides.pricePerMonth ?? 0,
    sessions: 0,
    savedThisMonth: 0,
    savingsMonth: '2026-07',
    memberSince: '2026-07-01',
    autoRenewal: overrides.autoRenewal ?? true,
    paymentMethodLastFour: overrides.paymentMethodLastFour ?? '4242',
    paymentMethodExpiry: overrides.paymentMethodExpiry ?? '09/29',
  });
}

describe('PaymentStore', () => {
  let injector: Injector;
  let store: PaymentStore;

  const paymentApiStub = {
    getSubscriptions: vi.fn(),
    getClientPlans: vi.fn(),
    getReceipts: vi.fn(),
    updateSubscription: vi.fn(),
    createSubscription: vi.fn(),
    patchSubscriptionSaved: vi.fn(),
  };

  beforeEach(() => {
    Object.values(paymentApiStub).forEach((spy) => spy.mockReset());

    injector = Injector.create({
      providers: [
        { provide: PaymentApi, useValue: paymentApiStub, deps: [] },
        { provide: CurrentUserService, useValue: { clientId: 'cli-001' }, deps: [] },
      ],
    });

    store = runInInjectionContext(injector, () => new PaymentStore());
  });

  it('toggleAutoRenewal should keep the current subscription unchanged when the API fails', () => {
    const current = makeSubscription({ autoRenewal: true });
    store['subscriptionSignal'].set(current);
    paymentApiStub.updateSubscription.mockReturnValue(throwError(() => new Error('boom')));

    store.toggleAutoRenewal();

    expect(paymentApiStub.updateSubscription).toHaveBeenCalledTimes(1);
    expect(paymentApiStub.updateSubscription.mock.calls[0][0]).toBeInstanceOf(Subscription);
    expect(store.subscription()).toBe(current);
    expect(store.subscription()?.autoRenewal).toBe(true);
  });

  it('updatePaymentMethod should keep the current payment details unchanged when the API fails', () => {
    const current = makeSubscription({ paymentMethodLastFour: '4242', paymentMethodExpiry: '09/29' });
    store['subscriptionSignal'].set(current);
    paymentApiStub.updateSubscription.mockReturnValue(throwError(() => new Error('boom')));

    store.updatePaymentMethod('1111', '10/30');

    expect(store.subscription()).toBe(current);
    expect(store.subscription()?.paymentMethodLastFour).toBe('4242');
    expect(store.subscription()?.paymentMethodExpiry).toBe('09/29');
  });

  it('switchPlan should keep the current plan unchanged when the API fails', () => {
    const current = makeSubscription({ planId: 'free', pricePerMonth: 0 });
    store['subscriptionSignal'].set(current);
    store['plansSignal'].set([
      { id: 'free', type: 'free', monthlyPrice: 0, discountPercent: 0 },
      { id: 'monthly', type: 'monthly', monthlyPrice: 39.99, discountPercent: 10 },
    ] as any);
    paymentApiStub.updateSubscription.mockReturnValue(throwError(() => new Error('boom')));

    store.switchPlan('monthly');

    expect(store.subscription()).toBe(current);
    expect(store.subscription()?.planId).toBe('free');
    expect(store.subscription()?.pricePerMonth).toBe(0);
  });
});
