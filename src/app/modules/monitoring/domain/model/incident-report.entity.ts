/*
  Domain entity for an incident report shown in the realtime-map
  Reports tab.

  Following the project DDD pattern, this is a class with private
  fields exposed through get/set accessors.
*/
import {BaseEntity} from '../../../../shared/domain/model/base-entity';

export type IncidentType = 'unauthorised-parking' | 'payment-failure';
export type IncidentSeverity = 'low' | 'medium' | 'high';

export class IncidentReport implements BaseEntity {
  private _id: string;
  private _code: string;
  private _type: IncidentType;
  private _spot: string;
  private _date: string;
  private _time: string;
  private _severity: IncidentSeverity;

  constructor(props: {
    id: string;
    code: string;
    type: IncidentType;
    spot: string;
    date: string;
    time: string;
    severity: IncidentSeverity;
  }) {
    this._id = props.id;
    this._code = props.code;
    this._type = props.type;
    this._spot = props.spot;
    this._date = props.date;
    this._time = props.time;
    this._severity = props.severity;
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get code(): string {
    return this._code;
  }

  set code(value: string) {
    this._code = value;
  }

  get type(): IncidentType {
    return this._type;
  }

  set type(value: IncidentType) {
    this._type = value;
  }

  get spot(): string {
    return this._spot;
  }

  set spot(value: string) {
    this._spot = value;
  }

  get date(): string {
    return this._date;
  }

  set date(value: string) {
    this._date = value;
  }

  get time(): string {
    return this._time;
  }

  set time(value: string) {
    this._time = value;
  }

  get severity(): IncidentSeverity {
    return this._severity;
  }

  set severity(value: IncidentSeverity) {
    this._severity = value;
  }
}
