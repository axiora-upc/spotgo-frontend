/*
  Entidades de dominio para la vista Analytics del módulo Monitoring.

  ParkingAnalytics es el agregado raíz que engloba todas las métricas
  calculadas a partir de la data de un parking específico:
  - KPIs principales (occupancy, peak hour, revenue, system health)
  - Ocupancia por hora del día (para el bar chart)
  - Tendencia semanal (para el line chart)
  - Spots más utilizados (para la tabla)

  SpotUtilization representa cada fila de la tabla "Most Utilized Spots".

  OccupancyPoint y WeeklyTrendPoint son value objects que alimentan
  los gráficos SVG del template.
*/
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/* ----- Value objects ----- */

export class OccupancyPoint {
  private _hour: string;
  private _intensity: number;

  constructor(props: { hour: string; intensity: number }) {
    this._hour = props.hour;
    this._intensity = props.intensity;
  }

  get hour(): string     { return this._hour; }
  set hour(v: string)    { this._hour = v; }

  get intensity(): number  { return this._intensity; }
  set intensity(v: number) { this._intensity = v; }
}

export class WeeklyTrendPoint {
  private _day: string;
  private _value: number;

  constructor(props: { day: string; value: number }) {
    this._day = props.day;
    this._value = props.value;
  }

  get day(): string    { return this._day; }
  set day(v: string)   { this._day = v; }

  get value(): number  { return this._value; }
  set value(v: number) { this._value = v; }
}

/* ----- SpotUtilization entity ----- */

export type SpotStatus = 'occupied' | 'available' | 'maintenance';
export type SpotType   = 'standard' | 'ev';

export class SpotUtilization implements BaseEntity {
  private _id: string;
  private _spotId: string;
  private _spotName: string;
  private _zone: string;
  private _type: SpotType;
  private _status: SpotStatus;
  private _dailyTurnover: number;
  private _peakUtilization: number;
  private _revenueImpact: number;

  constructor(props: {
    id: string;
    spotId: string;
    spotName: string;
    zone: string;
    type: SpotType;
    status: SpotStatus;
    dailyTurnover: number;
    peakUtilization: number;
    revenueImpact: number;
  }) {
    this._id               = props.id;
    this._spotId           = props.spotId;
    this._spotName         = props.spotName;
    this._zone             = props.zone;
    this._type             = props.type;
    this._status           = props.status;
    this._dailyTurnover    = props.dailyTurnover;
    this._peakUtilization  = props.peakUtilization;
    this._revenueImpact    = props.revenueImpact;
  }

  get id(): string               { return this._id; }
  set id(v: string)              { this._id = v; }

  get spotId(): string           { return this._spotId; }
  set spotId(v: string)          { this._spotId = v; }

  get spotName(): string         { return this._spotName; }
  set spotName(v: string)        { this._spotName = v; }

  get zone(): string             { return this._zone; }
  set zone(v: string)            { this._zone = v; }

  get type(): SpotType           { return this._type; }
  set type(v: SpotType)          { this._type = v; }

  get status(): SpotStatus       { return this._status; }
  set status(v: SpotStatus)      { this._status = v; }

  get dailyTurnover(): number    { return this._dailyTurnover; }
  set dailyTurnover(v: number)   { this._dailyTurnover = v; }

  get peakUtilization(): number  { return this._peakUtilization; }
  set peakUtilization(v: number) { this._peakUtilization = v; }

  get revenueImpact(): number    { return this._revenueImpact; }
  set revenueImpact(v: number)   { this._revenueImpact = v; }
}

/* ----- ParkingAnalytics root aggregate ----- */

export class ParkingAnalytics implements BaseEntity {
  private _parkingId: string;
  private _parkingName: string;
  private _averageOccupancy: number;
  private _occupancyTrendPercent: number;
  private _peakHour: string;
  private _totalRevenue: number;
  private _revenueTrendPercent: number;
  private _systemStatus: string;
  private _totalCapacity: number;
  private _efficiencyIndex: number;
  private _occupancyByHour: OccupancyPoint[];
  private _weeklyTrends: WeeklyTrendPoint[];
  private _mostUtilizedSpots: SpotUtilization[];
  private _maintenanceSpotsCount: number;

  constructor(props: {
    parkingId: string;
    parkingName: string;
    averageOccupancy: number;
    occupancyTrendPercent: number;
    peakHour: string;
    totalRevenue: number;
    revenueTrendPercent: number;
    systemStatus: string;
    totalCapacity: number;
    efficiencyIndex: number;
    occupancyByHour: OccupancyPoint[];
    weeklyTrends: WeeklyTrendPoint[];
    mostUtilizedSpots: SpotUtilization[];
    maintenanceSpotsCount?: number;
  }) {
    this._parkingId             = props.parkingId;
    this._parkingName           = props.parkingName;
    this._averageOccupancy      = props.averageOccupancy;
    this._occupancyTrendPercent = props.occupancyTrendPercent;
    this._peakHour              = props.peakHour;
    this._totalRevenue          = props.totalRevenue;
    this._revenueTrendPercent   = props.revenueTrendPercent;
    this._systemStatus          = props.systemStatus;
    this._totalCapacity         = props.totalCapacity;
    this._efficiencyIndex       = props.efficiencyIndex;
    this._occupancyByHour       = props.occupancyByHour;
    this._weeklyTrends          = props.weeklyTrends;
    this._mostUtilizedSpots     = props.mostUtilizedSpots;
    this._maintenanceSpotsCount = props.maintenanceSpotsCount ?? 0;
  }

  get id(): string                        { return this._parkingId; }
  set id(v: string)                       { this._parkingId = v; }

  get parkingId(): string                        { return this._parkingId; }
  set parkingId(v: string)                       { this._parkingId = v; }

  get parkingName(): string                      { return this._parkingName; }
  set parkingName(v: string)                     { this._parkingName = v; }

  get averageOccupancy(): number                 { return this._averageOccupancy; }
  set averageOccupancy(v: number)                { this._averageOccupancy = v; }

  get occupancyTrendPercent(): number            { return this._occupancyTrendPercent; }
  set occupancyTrendPercent(v: number)           { this._occupancyTrendPercent = v; }

  get peakHour(): string                         { return this._peakHour; }
  set peakHour(v: string)                        { this._peakHour = v; }

  get totalRevenue(): number                     { return this._totalRevenue; }
  set totalRevenue(v: number)                    { this._totalRevenue = v; }

  get revenueTrendPercent(): number              { return this._revenueTrendPercent; }
  set revenueTrendPercent(v: number)             { this._revenueTrendPercent = v; }

  get systemStatus(): string                     { return this._systemStatus; }
  set systemStatus(v: string)                    { this._systemStatus = v; }

  get totalCapacity(): number                    { return this._totalCapacity; }
  set totalCapacity(v: number)                   { this._totalCapacity = v; }

  get efficiencyIndex(): number                  { return this._efficiencyIndex; }
  set efficiencyIndex(v: number)                 { this._efficiencyIndex = v; }

  get occupancyByHour(): OccupancyPoint[]        { return this._occupancyByHour; }
  set occupancyByHour(v: OccupancyPoint[])       { this._occupancyByHour = v; }

  get weeklyTrends(): WeeklyTrendPoint[]         { return this._weeklyTrends; }
  set weeklyTrends(v: WeeklyTrendPoint[])        { this._weeklyTrends = v; }

  get mostUtilizedSpots(): SpotUtilization[]     { return this._mostUtilizedSpots; }
  set mostUtilizedSpots(v: SpotUtilization[])    { this._mostUtilizedSpots = v; }

  get maintenanceSpotsCount(): number            { return this._maintenanceSpotsCount; }
  set maintenanceSpotsCount(v: number)           { this._maintenanceSpotsCount = v; }

  get systemHealthLabel(): string {
    return this._systemStatus === 'active' ? 'analytics.kpi.optimum' : 'analytics.kpi.maintenance';
  }

  get isSystemHealthy(): boolean {
    return this._systemStatus === 'active';
  }
}
