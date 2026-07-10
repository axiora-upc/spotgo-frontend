/*
  Domain entity for an Employee shown in the realtime-map Employees tab.

  Following the DDD pattern used in the rest of the application, the
  entity is a CLASS (not just an interface). The class:
  - implements BaseEntity so it can be used by BaseApiEndpoint;
  - keeps private fields prefixed with underscore and exposes them via
    get/set accessors;
  - takes a props object in the constructor so callers don't need to
    remember positional argument order.

  The literal union types (EmployeeRole, EmployeeStatus, EmployeeSchedule)
  live next to the entity because they belong to the same domain
  concept and are referenced by both the entity and the form/view layer.
*/
import {BaseEntity} from '../../../../shared/domain/model/base-entity';

export type EmployeeRole = 'guard' | 'cleaning-personnel';
export type EmployeeStatus = 'on-duty' | 'off-duty';
export type EmployeeSchedule = 'all-week' | 'weekdays' | 'weekends';

export class Employee implements BaseEntity {
  private _id: string;
  private _parkingId: string;
  private _name: string;
  private _role: EmployeeRole;
  private _schedule: EmployeeSchedule;
  private _shiftStart: string;
  private _shiftEnd: string;
  private _assignedSpot: string | null;
  private _status: EmployeeStatus;

  constructor(props: {
    id: string;
    parkingId: string;
    name: string;
    role: EmployeeRole;
    schedule: EmployeeSchedule;
    shiftStart: string;
    shiftEnd: string;
    assignedSpot: string | null;
    status: EmployeeStatus;
  }) {
    this._id = props.id;
    this._parkingId = props.parkingId;
    this._name = props.name;
    this._role = props.role;
    this._schedule = props.schedule;
    this._shiftStart = props.shiftStart;
    this._shiftEnd = props.shiftEnd;
    this._assignedSpot = props.assignedSpot;
    this._status = props.status;
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get parkingId(): string {
    return this._parkingId;
  }

  set parkingId(value: string) {
    this._parkingId = value;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get role(): EmployeeRole {
    return this._role;
  }

  set role(value: EmployeeRole) {
    this._role = value;
  }

  get schedule(): EmployeeSchedule {
    return this._schedule;
  }

  set schedule(value: EmployeeSchedule) {
    this._schedule = value;
  }

  get shiftStart(): string {
    return this._shiftStart;
  }

  set shiftStart(value: string) {
    this._shiftStart = value;
  }

  get shiftEnd(): string {
    return this._shiftEnd;
  }

  set shiftEnd(value: string) {
    this._shiftEnd = value;
  }

  get assignedSpot(): string | null {
    return this._assignedSpot;
  }

  set assignedSpot(value: string | null) {
    this._assignedSpot = value;
  }

  get status(): EmployeeStatus {
    return this._status;
  }

  set status(value: EmployeeStatus) {
    this._status = value;
  }
}
