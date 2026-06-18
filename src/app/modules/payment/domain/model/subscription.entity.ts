/*
  Domain entity for a client's active subscription.

  Following the DDD pattern used in the rest of the application, the
  entity is a CLASS The class:
  - implements BaseEntity so it can be used by BaseApiEndpoint;
  - keeps private fields prefixed with underscore and exposes them via
    get/set accessors;
  - takes a props object in the constructor so callers don't need to
    remember positional argument order.

  SubscriptionStatus lives next to the entity because it belongs to
  the same domain concept and is referenced by both the entity and
  the view layer.
*/
/*
  BaseEntity is an interface that only requires an 'id' property.
  By implementing it, Subscription can be used anywhere the app
  expects a generic entity (e.g. BaseApiEndpoint).
*/
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  SubscriptionStatus is a TypeScript union type. It is the domain vocabulary: the set of values
  that make sense inside our application regardless of what string
  the database or API happens to store.

  If the API returns "ACTIVE" (uppercase) instead of "active", we
  handle that translation in the infrastructure layer (the service /
  mapper). The domain never sees the raw API string — it only ever
  works with these clean, lowercase values.

*/
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled';

export class Subscription implements BaseEntity {
  /*
    All fields are declared as 'private' with a leading underscore (_).

    'private' means these fields can ONLY be read or written from
    inside this class. No component, service, or other class can
    touch them directly. This protects the entity's internal state.

    The underscore (_) is a naming convention that signals "this is
    a private backing field". It is paired with a public get/set
    accessor below so the rest of the app can still read and write
    the value — but through a controlled interface.

    Example: _status cannot be set from outside, but status (the
    getter/setter pair) can be used anywhere.
  */
  private _id: string;
  private _clientId: string;   // foreign key → clients collection
  private _planId: string;     // foreign key → clientPlans collection
  private _status: SubscriptionStatus;
  private _renewsOn: string;
  private _pricePerMonth: number;
  private _sessions: number;
  private _savedThisMonth: number;
  private _savingsMonth: string;
  private _memberSince: string;
  private _autoRenewal: boolean;
  private _paymentMethodLastFour: string;
  private _paymentMethodExpiry: string;

  /*
    The constructor receives a single 'props' object instead of many
    positional arguments. This way, when you create a Subscription
    you write:
      new Subscription({ id: '...', clientId: '...', ... })
    instead of:
      new Subscription('...', '...', ...)
    Positional arguments are easy to mix up (e.g. swapping clientId
    and planId). A named props object makes every field explicit.
  */

  /**
   * Props is the name of the parameter of constructor, in this case,
   * could be prop, arg, data, etc.
   */
  constructor(props: {
    id: string;
    clientId: string;
    planId: string;
    status: SubscriptionStatus;
    renewsOn: string;
    pricePerMonth: number;
    sessions: number;
    savedThisMonth: number;
    savingsMonth: string;
    memberSince: string;
    autoRenewal: boolean;
    paymentMethodLastFour: string;
    paymentMethodExpiry: string;
  }) {

    /**
     * _ Means encapsuation, 
     * a core principle of OOP. 
     * It signals that these fields are private and should not be accessed directly from outside the class.
     */
    this._id = props.id;
    this._clientId = props.clientId;
    this._planId = props.planId;
    this._status = props.status;
    this._renewsOn = props.renewsOn;
    this._pricePerMonth = props.pricePerMonth;
    this._sessions = props.sessions;
    this._savedThisMonth = props.savedThisMonth;
    this._savingsMonth = props.savingsMonth;
    this._memberSince = props.memberSince;
    this._autoRenewal = props.autoRenewal;
    this._paymentMethodLastFour = props.paymentMethodLastFour;
    this._paymentMethodExpiry = props.paymentMethodExpiry;
  }

  /*
    Getters and setters are public by default (no keyword needed).
    They let the rest of the app read and write each field using the
    clean name (id, status, ...) while the actual storage stays
    private (_id, _status, ...).

    A getter is called when you READ:   subscription.status
    A setter is called when you WRITE:  subscription.status = 'active'
  */
  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get clientId(): string {
    return this._clientId;
  }

  set clientId(value: string) {
    this._clientId = value;
  }

  get planId(): string {
    return this._planId;
  }

  set planId(value: string) {
    this._planId = value;
  }

  get status(): SubscriptionStatus {
    return this._status;
  }

  set status(value: SubscriptionStatus) {
    this._status = value;
  }

  get renewsOn(): string {
    return this._renewsOn;
  }

  set renewsOn(value: string) {
    this._renewsOn = value;
  }

  get pricePerMonth(): number {
    return this._pricePerMonth;
  }

  set pricePerMonth(value: number) {
    this._pricePerMonth = value;
  }

  get sessions(): number {
    return this._sessions;
  }

  set sessions(value: number) {
    this._sessions = value;
  }

  get savedThisMonth(): number {
    return this._savedThisMonth;
  }

  set savedThisMonth(value: number) {
    this._savedThisMonth = value;
  }

  get savingsMonth(): string {
    return this._savingsMonth;
  }

  set savingsMonth(value: string) {
    this._savingsMonth = value;
  }

  get memberSince(): string {
    return this._memberSince;
  }

  set memberSince(value: string) {
    this._memberSince = value;
  }

  get autoRenewal(): boolean {
    return this._autoRenewal;
  }

  set autoRenewal(value: boolean) {
    this._autoRenewal = value;
  }

  get paymentMethodLastFour(): string {
    return this._paymentMethodLastFour;
  }

  set paymentMethodLastFour(value: string) {
    this._paymentMethodLastFour = value;
  }

  get paymentMethodExpiry(): string {
    return this._paymentMethodExpiry;
  }

  set paymentMethodExpiry(value: string) {
    this._paymentMethodExpiry = value;
  }
}
