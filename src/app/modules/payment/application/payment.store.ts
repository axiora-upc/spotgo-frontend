/*
  PaymentStore is the application layer of the payment module.

  It is the bridge between the view and the API:
    View  calls store methods
    Store calls PaymentApi
    PaymentApi delegates to the correct endpoint
    Endpoint executes the HTTP call

  The view never talks to PaymentApi directly.
  It only reads signals and calls store methods.
*/
import { Injectable, inject, signal, computed } from '@angular/core';

/*
  retry retries a failed HTTP call once before showing the error.
  Used only on write operations like PUT.
*/
import { retry } from 'rxjs';

import { Subscription } from '../domain/model/subscription.entity';
import { ClientPlan } from '../domain/model/client-plan.entity';
import { Receipt } from '../domain/model/receipt.entity';

/*
  PaymentApi is the injectable class that holds all the endpoints.
  The store asks Angular for it with inject() — no 'new' needed.
*/
import { PaymentApi } from '../infrastructure/payment-api';

/*
  @Injectable allows Angular to create and manage this class.
  providedIn: 'root' means one single instance exists for the whole app —
  every component that injects this store gets the same instance.
*/
@Injectable({ providedIn: 'root' })
export class PaymentStore {

  /*
    Angular delivers PaymentApi here automatically.
    The store is the only class that talks to PaymentApi.
  */
  private readonly paymentApi = inject(PaymentApi);

  /*
    Signals are the in-memory state of the page.
    They are private so only this store can change them.
    The view receives readonly versions below — it can read but not write.
  */
  private readonly subscriptionSignal = signal<Subscription | null>(null);
  private readonly plansSignal        = signal<ClientPlan[]>([]);
  private readonly receiptsSignal     = signal<Receipt[]>([]);
  private readonly loadingSignal      = signal(false);
  private readonly errorSignal        = signal<string | null>(null);

  /*
    Public readonly signals exposed to the view.
    asReadonly() removes set() so the view cannot mutate state directly —
    all changes must go through a store method.
  */
  readonly subscription = this.subscriptionSignal.asReadonly();
  readonly plans        = this.plansSignal.asReadonly();
  readonly receipts     = this.receiptsSignal.asReadonly();
  readonly loading      = this.loadingSignal.asReadonly();
  readonly error        = this.errorSignal.asReadonly();

  readonly currentDiscount = computed(() => {
    const sub = this.subscriptionSignal();
    if (!sub) return 0;
    const plan = this.plansSignal().find(p => p.id === sub.planId);
    return plan?.discountPercent ?? 0;
  });

  readonly currentMonthSavings = computed(() =>
    this.subscriptionSignal()?.savedThisMonth ?? 0
  );

  /*
    Called by the view on init, passing the logged-in client id.

    What happens:
      1. loading is set to true so the view can show a spinner
      2. store calls paymentApi.getSubscriptions()
      3. paymentApi delegates to SubscriptionsApiEndpoint
      4. endpoint does GET /subscriptions and returns Subscription[]
      5. store finds the one matching clientId and saves it in the signal
      6. view reads the signal and updates automatically
  */
  loadSubscriptionByClientId(clientId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.paymentApi.getSubscriptions().subscribe({
      next: (subscriptions) => {
        const found = subscriptions.find((s) => s.clientId === clientId) ?? null;
        if (found) {
          const currentMonth = this.currentYearMonth();
          if (found.savingsMonth !== currentMonth) {
            found.savedThisMonth = 0;
            found.savingsMonth   = currentMonth;
            this.paymentApi.patchSubscriptionSaved(found.id, 0, currentMonth).subscribe();
          }
        }
        this.subscriptionSignal.set(found);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to load subscription'));
        this.loadingSignal.set(false);
      },
    });
  }

  private currentYearMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  /*
    Called by the view on init to populate the Available Plans section.

    What happens:
      1. store calls paymentApi.getClientPlans()
      2. paymentApi delegates to ClientPlansApiEndpoint
      3. endpoint does GET /clientPlans and returns ClientPlan[]
      4. store saves the list in the signal
      5. view reads the signal and renders the plan cards
  */
  loadPlans(): void {
    this.paymentApi.getClientPlans().subscribe({
      next: (plans) => this.plansSignal.set(plans),
      error: (err) =>
        this.errorSignal.set(this.formatError(err, 'Failed to load plans')),
    });
  }

  /*
    Called when the user clicks the Auto-renewal toggle.

    What happens:
      1. store reads the current subscription from the signal
      2. flips autoRenewal (true to false or false to true)
      3. store calls paymentApi.updateSubscription()
      4. paymentApi delegates to SubscriptionsApiEndpoint
      5. endpoint does PUT /subscriptions/sub-001 with the updated data
      6. store saves the updated subscription in the signal
      7. view reads the signal and the toggle updates visually

    callbacks let the view react to success or error (e.g. show a message)
    without the store depending on any UI library.
  */
  toggleAutoRenewal(
    callbacks?: { onSuccess?: () => void; onError?: () => void }
  ): void {
    const current = this.subscriptionSignal();

    if (!current) return;

    current.autoRenewal = !current.autoRenewal;

    this.paymentApi
      .updateSubscription(current)
      .pipe(retry(1))
      .subscribe({
        next: (updated) => {
          this.subscriptionSignal.set(updated);
          callbacks?.onSuccess?.();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to update subscription'));
          callbacks?.onError?.();
        },
      });
  }

  /*
    Called when the user confirms a plan switch in the modal.

    What happens:
      1. store reads the current subscription from the signal
      2. updates planId to the new plan
      3. store calls paymentApi.updateSubscription()
      4. endpoint does PUT /subscriptions/sub-001 with the updated planId
      5. store saves the updated subscription in the signal
      6. view reacts via callbacks (close modal, show message)
  */
  switchPlan(
    newPlanId: string,
    callbacks?: { onSuccess?: () => void; onError?: () => void }
  ): void {
    const current = this.subscriptionSignal();
    if (!current) return;

    current.planId = newPlanId;

    /*
      Update pricePerMonth to match the new plan's price so the
      subscription card reflects the correct amount after switching.
    */
    const newPlan = this.plansSignal().find(p => p.id === newPlanId);
    if (newPlan) current.pricePerMonth = newPlan.monthlyPrice;

    const today = new Date();
    current.memberSince = today.toISOString().split('T')[0];

    if (newPlan?.type === 'annual') {
      today.setFullYear(today.getFullYear() + 1);
      current.renewsOn = today.toISOString().split('T')[0];
    } else if (newPlan?.type === 'monthly') {
      today.setMonth(today.getMonth() + 1);
      current.renewsOn = today.toISOString().split('T')[0];
    } else if (newPlan?.type === 'free') {
      current.renewsOn = '';
    }

    this.paymentApi
      .updateSubscription(current)
      .pipe(retry(1))
      .subscribe({
        next: (updated) => {
          this.subscriptionSignal.set(updated);
          callbacks?.onSuccess?.();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to switch plan'));
          callbacks?.onError?.();
        },
      });
  }

  /*
    Called when the user submits the payment method form.
    Updates paymentMethodLastFour and paymentMethodExpiry on the subscription.
  */
  updatePaymentMethod(
    lastFour: string,
    expiry: string,
    callbacks?: { onSuccess?: () => void; onError?: () => void }
  ): void {
    const current = this.subscriptionSignal();
    if (!current) return;

    current.paymentMethodLastFour = lastFour;
    current.paymentMethodExpiry = expiry;

    this.paymentApi
      .updateSubscription(current)
      .pipe(retry(1))
      .subscribe({
        next: (updated) => {
          this.subscriptionSignal.set(updated);
          callbacks?.onSuccess?.();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to update payment method'));
          callbacks?.onError?.();
        },
      });
  }

  /*
    Converts an HTTP error into a readable string for the error signal.
    If the error is a known Error object, uses its message.
    Otherwise uses the fallback string provided by the caller.
  */
  /*
    Called by ReceiptsComponent on init, passing the logged-in client id.

    What happens:
      1. loading is set to true so the view can show a loading state
      2. store calls paymentApi.getReceipts()
      3. paymentApi delegates to ReceiptsApiEndpoint
      4. endpoint does GET /receipts and returns Receipt[]
      5. store filters the list to keep only the client's receipts
      6. store sorts them by date descending (newest first)
      7. view reads the signal and updates automatically
  */
  loadReceiptsByClientId(clientId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.paymentApi.getReceipts().subscribe({
      next: (receipts) => {
        const filtered = receipts
          .filter((r) => r.clientId === clientId)
          .sort((a, b) => b.date.localeCompare(a.date));   // newest first
        this.receiptsSignal.set(filtered);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to load receipts'));
        this.loadingSignal.set(false);
      },
    });
  }

  subtractFromSavedThisMonth(amount: number): void {
    const sub = this.subscriptionSignal();
    if (!sub || amount <= 0) return;
    const newSaved = Math.max(0, Math.round((sub.savedThisMonth - amount) * 100) / 100);
    const month = this.currentYearMonth();
    this.paymentApi.patchSubscriptionSaved(sub.id, newSaved, month).subscribe({
      next: () => {
        sub.savedThisMonth = newSaved;
        sub.savingsMonth   = month;
        this.subscriptionSignal.set(sub);
      }
    });
  }

  addToSavedThisMonth(amount: number): void {
    const sub = this.subscriptionSignal();
    if (!sub || amount <= 0) return;
    const newSaved = Math.round((sub.savedThisMonth + amount) * 100) / 100;
    const month = this.currentYearMonth();
    this.paymentApi.patchSubscriptionSaved(sub.id, newSaved, month).subscribe({
      next: () => {
        sub.savedThisMonth = newSaved;
        sub.savingsMonth   = month;
        this.subscriptionSignal.set(sub);
      }
    });
  }

  private formatError(err: unknown, fallback: string): string {
    if (err instanceof Error) {
      return err.message.includes('Resource not found')
        ? `${fallback}: not found`
        : err.message;
    }
    return fallback;
  }
}
