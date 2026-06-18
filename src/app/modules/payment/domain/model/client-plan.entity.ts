/*
  Domain entity for a subscription plan available to clients.

  Following the DDD pattern used in the rest of the application, the
  entity is a CLASS The class:
  - implements BaseEntity so it can be used by BaseApiEndpoint;
  - keeps private fields prefixed with underscore and exposes them via
    get/set accessors;
  - takes a props object in the constructor so callers don't need to
    remember positional argument order.

  PlanType lives next to the entity because it belongs to
  the same domain concept and is referenced by both the entity and
  the view layer.
*/
/*
  BaseEntity is an interface that only requires an 'id' property.
  By implementing it, ClientPlan can be used anywhere the app
  expects a generic entity (e.g. BaseApiEndpoint).
*/
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  PlanType is a TypeScript union type. It is the domain vocabulary: the set of values
  that make sense inside our application regardless of what string
  the database or API happens to store.

  If the API returns "FREE" (uppercase) instead of "free", we
  handle that translation in the infrastructure layer (the service /
  mapper). The domain never sees the raw API string — it only ever
  works with these clean, lowercase values.
*/
export type PlanType = 'free' | 'monthly' | 'annual';

export class ClientPlan implements BaseEntity {
  /*
    All fields are declared as 'private' with a leading underscore (_).

    'private' means these fields can ONLY be read or written from
    inside this class. No component, service, or other class can
    touch them directly. This protects the entity's internal state.

    The underscore (_) is a naming convention that signals "this is
    a private backing field". It is paired with a public get/set
    accessor below so the rest of the app can still read and write
    the value — but through a controlled interface.

    Example: _type cannot be set from outside, but type (the
    getter/setter pair) can be used anywhere.
  */
  private _id: string;
  private _type: PlanType;
  private _name: string;
  private _monthlyPrice: number;
  private _description: string;
  private _reservationsPerMonth: number | null;  // null means unlimited
  private _discountPercent: number;
  private _features: string[];

  /*
    The constructor receives a single 'props' object instead of many
    positional arguments. This way, when you create a ClientPlan
    you write:
      new ClientPlan({ id: '...', type: '...', ... })
    instead of:
      new ClientPlan('...', '...', ...)
    Positional arguments are easy to mix up (e.g. swapping name
    and description). A named props object makes every field explicit.
  */

  /**
   * Props is the name of the parameter of constructor, in this case,
   * could be prop, arg, data, etc.
   */
  constructor(props: {
    id: string;
    type: PlanType;
    name: string;
    monthlyPrice: number;
    description: string;
    reservationsPerMonth: number | null;
    discountPercent: number;
    features: string[];
  }) {
    /**
     * _ Means encapsulation,
     * a core principle of OOP.
     * It signals that these fields are
     * private and should not be accessed directly from outside the class.
     */
    this._id = props.id;
    this._type = props.type;
    this._name = props.name;
    this._monthlyPrice = props.monthlyPrice;
    this._description = props.description;
    this._reservationsPerMonth = props.reservationsPerMonth;
    this._discountPercent = props.discountPercent;
    this._features = props.features;
  }

  /*
    Getters and setters are public by default (no keyword needed).
    They let the rest of the app read and write each field using the
    clean name (id, type, ...) while the actual storage stays
    private (_id, _type, ...).

    A getter is called when you READ:   plan.type
    A setter is called when you WRITE:  plan.type = 'monthly'
  */
  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get type(): PlanType {
    return this._type;
  }

  set type(value: PlanType) {
    this._type = value;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get monthlyPrice(): number {
    return this._monthlyPrice;
  }

  set monthlyPrice(value: number) {
    this._monthlyPrice = value;
  }

  get description(): string {
    return this._description;
  }

  set description(value: string) {
    this._description = value;
  }

  get reservationsPerMonth(): number | null {
    return this._reservationsPerMonth;
  }

  set reservationsPerMonth(value: number | null) {
    this._reservationsPerMonth = value;
  }

  get discountPercent(): number {
    return this._discountPercent;
  }

  set discountPercent(value: number) {
    this._discountPercent = value;
  }

  get features(): string[] {
    return this._features;
  }

  set features(value: string[]) {
    this._features = value;
  }
}
