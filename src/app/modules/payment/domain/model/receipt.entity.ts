/*
  Domain entity for a client's parking receipt.

  Follows the same DDD pattern as Subscription:
  - Implements BaseEntity so BaseApiEndpoint can handle it.
  - Private fields with underscore prefix, exposed via get/set accessors.
  - Constructor takes a props object so field order is explicit and safe.

  ReceiptStatus is the domain vocabulary for the lifecycle of a receipt.
  The raw API string is cast to this type in the assembler — the entity
  itself never sees the raw HTTP response.
*/
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  Three possible states for a receipt:
    paid     → transaction completed successfully
    refunded → amount was returned to the client
    pending  → payment is still being processed
*/
export type ReceiptStatus = 'paid' | 'refunded' | 'pending';

export class Receipt implements BaseEntity {
  /*
    All fields are private with a leading underscore.
    External code must go through the get/set accessors,
    keeping the entity's internal state protected.
  */
  private _id: string;
  private _clientId: string;         // foreign key → clients collection
  private _invoiceNumber: string;    // e.g. "INV-2026-0412"
  private _locationName: string;     // parking lot display name
  private _date: string;             // ISO date, e.g. "2026-04-12"
  private _durationHours: number;    // integer hours of the session
  private _durationMinutes: number;  // remaining minutes (0–59)
  private _paymentMethod: string;    // e.g. "Visa •• 4242" or "Apple Pay"
  private _bookingCode: string;      // e.g. "SPG-A1B2C3"
  private _amount: number;           // total amount charged in S/.
  private _status: ReceiptStatus;

  /*
    Named props object avoids positional-argument confusion.
    Callers write: new Receipt({ id: '...', clientId: '...', ... })
  */
  constructor(props: {
    id: string;
    clientId: string;
    invoiceNumber: string;
    locationName: string;
    date: string;
    durationHours: number;
    durationMinutes: number;
    paymentMethod: string;
    bookingCode: string;
    amount: number;
    status: ReceiptStatus;
  }) {
    this._id             = props.id;
    this._clientId       = props.clientId;
    this._invoiceNumber  = props.invoiceNumber;
    this._locationName   = props.locationName;
    this._date           = props.date;
    this._durationHours  = props.durationHours;
    this._durationMinutes = props.durationMinutes;
    this._paymentMethod  = props.paymentMethod;
    this._bookingCode    = props.bookingCode;
    this._amount         = props.amount;
    this._status         = props.status;
  }

  /* ── Accessors ──────────────────────────────────────────────────────────── */

  get id(): string { return this._id; }
  set id(value: string) { this._id = value; }

  get clientId(): string { return this._clientId; }
  set clientId(value: string) { this._clientId = value; }

  get invoiceNumber(): string { return this._invoiceNumber; }
  set invoiceNumber(value: string) { this._invoiceNumber = value; }

  get locationName(): string { return this._locationName; }
  set locationName(value: string) { this._locationName = value; }

  get date(): string { return this._date; }
  set date(value: string) { this._date = value; }

  get durationHours(): number { return this._durationHours; }
  set durationHours(value: number) { this._durationHours = value; }

  get durationMinutes(): number { return this._durationMinutes; }
  set durationMinutes(value: number) { this._durationMinutes = value; }

  get paymentMethod(): string { return this._paymentMethod; }
  set paymentMethod(value: string) { this._paymentMethod = value; }

  get bookingCode(): string { return this._bookingCode; }
  set bookingCode(value: string) { this._bookingCode = value; }

  get amount(): number { return this._amount; }
  set amount(value: number) { this._amount = value; }

  get status(): ReceiptStatus { return this._status; }
  set status(value: ReceiptStatus) { this._status = value; }
}
