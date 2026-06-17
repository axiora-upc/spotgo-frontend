import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PaymentStore } from '../../../application/payment.store';
import { ClientPlan } from '../../../domain/model/client-plan.entity';
import { CurrentUserService } from '../../../../../shared/services/current-user.service';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.css',
})
export class SubscriptionsComponent implements OnInit {

  /*
    The store is the only dependency this component needs.
    It provides all signals (subscription, plans, loading, error)
    and all actions (loadSubscriptionByClientId, loadPlans, toggleAutoRenewal).
  */
  protected readonly store      = inject(PaymentStore);
  private  readonly currentUser = inject(CurrentUserService);

  /*
    Computed values derived from the subscription signal.
    They recalculate automatically whenever the subscription changes.
  */
  private readonly effectiveRenewsOn = computed(() => {
    const sub = this.store.subscription();
    if (!sub) return new Date();
    if (!sub.renewsOn) return new Date();
    const isAnnual = this.currentPlan()?.type === 'annual';
    const date = new Date(sub.renewsOn);
    if (Number.isNaN(date.getTime())) return new Date();
    const now = new Date();
    while (date <= now) {
      if (isAnnual) {
        date.setFullYear(date.getFullYear() + 1);
      } else {
        date.setMonth(date.getMonth() + 1);
      }
    }
    return date;
  });

  protected readonly hoursUntilRenewal = computed(() => {
    const diffMs = this.effectiveRenewsOn().getTime() - Date.now();
    return diffMs > 0 ? Math.round(diffMs / (1000 * 60 * 60)) : 0;
  });

  protected readonly totalHoursInBillingPeriod = computed(() => {
    const renewsOn = this.effectiveRenewsOn();
    const periodStart = new Date(renewsOn);
    if (this.currentPlan()?.type === 'annual') {
      periodStart.setFullYear(periodStart.getFullYear() - 1);
    } else {
      periodStart.setMonth(periodStart.getMonth() - 1);
    }
    return Math.round((renewsOn.getTime() - periodStart.getTime()) / (1000 * 60 * 60));
  });

  protected readonly hasPlanTimeRemaining = computed(() => {
    const plan = this.currentPlan();
    return plan?.type === 'monthly' || plan?.type === 'annual';
  });

  protected readonly hoursUsedInBillingPeriod = computed(() => {
    const total = this.totalHoursInBillingPeriod();
    const remaining = this.hoursUntilRenewal();
    return Math.min(total, Math.max(0, total - remaining));
  });

  protected readonly timeUsedPercent = computed(() => {
    const total = this.totalHoursInBillingPeriod();
    const used = this.hoursUsedInBillingPeriod();
    if (total === 0) return 0;
    return Math.min(100, Math.max(0, Math.round((used / total) * 100)));
  });

  protected readonly renewsOnFormatted = computed(() => {
    return this.effectiveRenewsOn().toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  });

  protected readonly memberSinceFormatted = computed(() => {
    const sub = this.store.subscription();
    if (!sub) return '';
    return new Date(sub.memberSince).toLocaleDateString('en-US', {
      month: 'short', year: 'numeric'
    });
  });

  protected readonly currentPlan = computed(() => {
    const sub = this.store.subscription();
    if (!sub) return null;
    return this.store.plans().find(p => p.id === sub.planId) ?? null;
  });

  protected readonly currentPlanNameKey = computed(() => {
    const plan = this.currentPlan();
    return plan ? `subscription.plans.${plan.type}.name` : '';
  });

  protected readonly planFeaturesMap: Record<string, string[]> = {
    free: [
      'subscription.plans.free.features.availability',
      'subscription.plans.free.features.search',
      'subscription.plans.free.features.reservation',
      'subscription.plans.free.features.pay-per-use',
    ],
    monthly: [
      'subscription.plans.monthly.features.unlimited',
      'subscription.plans.monthly.features.entry-exit',
      'subscription.plans.monthly.features.receipts',
      'subscription.plans.monthly.features.extensions',
      'subscription.plans.monthly.features.faster',
    ],
    annual: [
      'subscription.plans.annual.features.monthly-benefits',
      'subscription.plans.annual.features.valid',
      'subscription.plans.annual.features.discount',
      'subscription.plans.annual.features.priority',
      'subscription.plans.annual.features.preferred',
    ],
  };

  protected getPlanFeatures(type: string): string[] {
    return this.planFeaturesMap[type] ?? [];
  }

  /*
    Returns true if the given plan is the one the client is currently on.
    Used by the template to highlight the current plan card.
  */
  protected isCurrentPlan(planId: string): boolean {
    return this.store.subscription()?.planId === planId;
  }

  ngOnInit(): void {
    this.store.loadSubscriptionByClientId(this.currentUser.clientId);
    this.store.loadPlans();
  }

  protected onToggleAutoRenewal(): void {
    this.store.toggleAutoRenewal();
  }

  /* ── Payment method modal ─────────────────────────────── */

  protected readonly showPaymentModal = signal(false);

  /*
    Custom validator for expiry date format MM/YY.
    Returns an error if the value does not match MM/YY
    or if the date is already in the past.
  */
  private expiryValidator(control: AbstractControl): ValidationErrors | null {
    const value: string = control.value ?? '';
    const match = value.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!match) return { expiryFormat: true };

    const month = parseInt(match[1], 10);
    const year = 2000 + parseInt(match[2], 10);
    const now = new Date();
    const expiry = new Date(year, month - 1, 1);
    if (expiry < new Date(now.getFullYear(), now.getMonth(), 1)) {
      return { expiryPast: true };
    }
    return null;
  }

  protected readonly paymentForm = new FormGroup({
    cardNumber: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{16}$/),
    ]),
    cardHolder: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
    ]),
    expiry: new FormControl('', [
      Validators.required,
      (c) => this.expiryValidator(c),
    ]),
    cvv: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{3,4}$/),
    ]),
  });

  protected openPaymentModal(): void {
    this.paymentForm.reset();
    this.showPaymentModal.set(true);
  }

  protected closePaymentModal(): void {
    this.showPaymentModal.set(false);
  }

  protected onSubmitPayment(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const cardNumber = this.paymentForm.value.cardNumber ?? '';
    const expiry     = this.paymentForm.value.expiry ?? '';
    const lastFour   = cardNumber.slice(-4);

    this.store.updatePaymentMethod(lastFour, expiry, {
      onSuccess: () => this.closePaymentModal(),
    });
  }

  /*
    Returns the error message for a given form field.
    Used in the template to show inline validation messages.
  */
  protected getError(field: 'cardNumber' | 'cardHolder' | 'expiry' | 'cvv'): string | null {
    const control = this.paymentForm.get(field);
    if (!control || !control.touched || control.valid) return null;

    if (control.hasError('required'))     return 'subscription.errors.required';
    if (control.hasError('pattern'))      return field === 'cardNumber'
      ? 'subscription.errors.card-number-invalid'
      : 'subscription.errors.cvv-invalid';
    if (control.hasError('minlength'))    return 'subscription.errors.name-too-short';
    if (control.hasError('expiryFormat')) return 'subscription.errors.expiry-format';
    if (control.hasError('expiryPast'))   return 'subscription.errors.expiry-past';
    return null;
  }

  /*
    Holds the plan the user wants to switch to.
    null means the modal is closed.
    Set when the user clicks Switch Plan or Upgrade on a plan card.
  */
  protected readonly selectedPlan = signal<ClientPlan | null>(null);

  protected onSwitchPlan(plan: ClientPlan): void {
    this.selectedPlan.set(plan);
  }

  protected onCancelSwitch(): void {
    this.selectedPlan.set(null);
  }

  protected onConfirmSwitch(): void {
    const plan = this.selectedPlan();
    if (!plan) return;

    this.store.switchPlan(plan.id, {
      onSuccess: () => this.selectedPlan.set(null),
    });
  }
}
