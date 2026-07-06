import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { DetectedSpot } from './detected-spot.entity';

/*
  Blueprint es la entidad de dominio que representa el croquis subido
  por un admin para su estacionamiento.

  adminId asocia el croquis con el admin propietario, de forma que cada
  centro de estacionamiento ve únicamente sus propios croquis guardados
  en la base de datos (backend API), y no los de otros admins.

  parkingId identifica el estacionamiento al que pertenece el croquis.
  Al guardarlo, el servicio usa ese id para actualizar totalSpaces,
  availableSpaces y totalFloors del parking con los datos del croquis.
*/
export class Blueprint implements BaseEntity {
  private _id: string;
  private _adminId: string;
  private _parkingId: string;
  private _name: string;
  private _dataUrl: string;
  private _spots: DetectedSpot[];

  constructor(props: {
    id: string;
    adminId: string;
    parkingId: string;
    name: string;
    dataUrl: string;
    spots?: DetectedSpot[];
  }) {
    this._id        = props.id;
    this._adminId   = props.adminId;
    this._parkingId = props.parkingId;
    this._name      = props.name;
    this._dataUrl   = props.dataUrl;
    this._spots     = props.spots ?? [];
  }

  get id(): string             { return this._id; }
  set id(v: string)            { this._id = v; }

  get adminId(): string        { return this._adminId; }
  set adminId(v: string)       { this._adminId = v; }

  get parkingId(): string      { return this._parkingId; }
  set parkingId(v: string)     { this._parkingId = v; }

  get name(): string           { return this._name; }
  set name(v: string)          { this._name = v; }

  get dataUrl(): string        { return this._dataUrl; }
  set dataUrl(v: string)       { this._dataUrl = v; }

  get spots(): DetectedSpot[]  { return this._spots; }
  set spots(v: DetectedSpot[]) { this._spots = v; }
}
