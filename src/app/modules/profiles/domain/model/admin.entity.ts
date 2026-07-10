import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  Admin entity – represents the parking-lot owner / administrator.
  Only the fields that are displayed and editable in the Settings view
  are modelled here. The rest (password, sensors, etc.) travel through
  the API but are ignored by this bounded context.
*/
export class Admin implements BaseEntity {
  private _id: string;
  private _firstName: string;
  private _lastName: string;
  private _email: string;
  private _phone: string;
  private _parkingName: string;
  private _parkingId: string | null;

  constructor(props: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    parkingName: string;
    parkingId?: string | null;
  }) {
    this._id          = props.id;
    this._firstName   = props.firstName;
    this._lastName    = props.lastName;
    this._email       = props.email;
    this._phone       = props.phone;
    this._parkingName = props.parkingName;
    this._parkingId   = props.parkingId ?? null;
  }

  get id(): string                  { return this._id; }
  set id(v: string)                 { this._id = v; }

  get firstName(): string           { return this._firstName; }
  set firstName(v: string)          { this._firstName = v; }

  get lastName(): string            { return this._lastName; }
  set lastName(v: string)           { this._lastName = v; }

  get fullName(): string            { return `${this._firstName} ${this._lastName}`; }

  get email(): string               { return this._email; }
  set email(v: string)              { this._email = v; }

  get phone(): string               { return this._phone; }
  set phone(v: string)              { this._phone = v; }

  get parkingName(): string         { return this._parkingName; }
  set parkingName(v: string)        { this._parkingName = v; }

  get parkingId(): string | null    { return this._parkingId; }
}
