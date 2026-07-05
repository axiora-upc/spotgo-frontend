import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  Role is the set of account types supported by SpotGo.

  - 'admin'  -> Operator account. Manages a parking lot (pricing, spaces, revenue).
  - 'client' -> Driver account. Finds, reserves and pays for parking spots.

  These values must match the "name" field of the /roles resource in the mock
  backend (server/db.json), since IamApi resolves the role by name after
  reading the /userRoles join table.
*/
export type Role = 'admin' | 'client';

/*
  User is the domain entity for the IAM bounded context.

  It represents the authenticated identity of whoever is using the app,
  regardless of whether they are a Driver (client) or an Operator (admin).

  Other bounded contexts (profiles, monitoring, etc.) keep their own
  entities (e.g. Admin in the profiles module) for the data they manage.
  This entity only carries what IAM itself needs: identity + role.
*/
export class User implements BaseEntity {
  private _id: string;
  private _firstName: string;
  private _lastName: string;
  private _email: string;
  private _phone: string;
  private _city: string;
  private _role: Role;
  private _parkingId: string | null;
  private _parkingName: string;

  constructor(props: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    city?: string;
    role: Role;
    parkingId?: string | null;
    parkingName?: string;
  }) {
    this._id          = props.id;
    this._firstName   = props.firstName;
    this._lastName    = props.lastName;
    this._email       = props.email;
    this._phone       = props.phone ?? '';
    this._city        = props.city ?? '';
    this._role        = props.role;
    this._parkingId   = props.parkingId ?? null;
    this._parkingName = props.parkingName ?? '';
  }

  get id(): string { return this._id; }
  get firstName(): string { return this._firstName; }
  get lastName(): string { return this._lastName; }
  get fullName(): string { return `${this._firstName} ${this._lastName}`.trim(); }
  get email(): string { return this._email; }
  get phone(): string { return this._phone; }
  get city(): string { return this._city; }
  get role(): Role { return this._role; }
  get parkingId(): string | null { return this._parkingId; }
  get parkingName(): string { return this._parkingName; }

  get isAdmin(): boolean { return this._role === 'admin'; }
  get isClient(): boolean { return this._role === 'client'; }
}
