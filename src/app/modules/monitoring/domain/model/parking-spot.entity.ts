/*
  Domain entities used by the Overview tab.

  Unlike Employee or IncidentReport, the parking domain is a tree of
  small entities and value objects that compose into a single
  ParkingSnapshot. We declare every layer here so the assembler can
  rebuild the same shape from the API response.

  ParkingSpot is the leaf entity (one slot on the map). Facility,
  ParkingStats, PeakHour and ParkingRow are aggregates that group
  spots and add metadata.
*/

export type ParkingSpotStatus = 'available' | 'occupied' | 'maintenance';

export class ParkingSpot {
  private _id: string;
  private _status: ParkingSpotStatus;

  constructor(props: { id: string; status: ParkingSpotStatus }) {
    this._id = props.id;
    this._status = props.status;
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get status(): ParkingSpotStatus {
    return this._status;
  }

  set status(value: ParkingSpotStatus) {
    this._status = value;
  }
}

export class ParkingRow {
  private _id: string;
  private _spots: ParkingSpot[];

  constructor(props: { id: string; spots: ParkingSpot[] }) {
    this._id = props.id;
    this._spots = props.spots;
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get spots(): ParkingSpot[] {
    return this._spots;
  }

  set spots(value: ParkingSpot[]) {
    this._spots = value;
  }
}

export class PeakHour {
  private _hour: string;
  private _intensity: number;

  constructor(props: { hour: string; intensity: number }) {
    this._hour = props.hour;
    this._intensity = props.intensity;
  }

  get hour(): string {
    return this._hour;
  }

  set hour(value: string) {
    this._hour = value;
  }

  get intensity(): number {
    return this._intensity;
  }

  set intensity(value: number) {
    this._intensity = value;
  }
}

export class ParkingStats {
  private _totalSpaces: number;
  private _currentlyAvailable: number;
  private _availableTrendPercent: number;
  private _occupancyRate: number;
  private _revenueYield: number;
  private _revenueTrendPercent: number;
  private _peakHours: PeakHour[];

  constructor(props: {
    totalSpaces: number;
    currentlyAvailable: number;
    availableTrendPercent: number;
    occupancyRate: number;
    revenueYield: number;
    revenueTrendPercent: number;
    peakHours: PeakHour[];
  }) {
    this._totalSpaces = props.totalSpaces;
    this._currentlyAvailable = props.currentlyAvailable;
    this._availableTrendPercent = props.availableTrendPercent;
    this._occupancyRate = props.occupancyRate;
    this._revenueYield = props.revenueYield;
    this._revenueTrendPercent = props.revenueTrendPercent;
    this._peakHours = props.peakHours;
  }

  get totalSpaces(): number {
    return this._totalSpaces;
  }

  set totalSpaces(v: number) {
    this._totalSpaces = v;
  }

  get currentlyAvailable(): number {
    return this._currentlyAvailable;
  }

  set currentlyAvailable(v: number) {
    this._currentlyAvailable = v;
  }

  get availableTrendPercent(): number {
    return this._availableTrendPercent;
  }

  set availableTrendPercent(v: number) {
    this._availableTrendPercent = v;
  }

  get occupancyRate(): number {
    return this._occupancyRate;
  }

  set occupancyRate(v: number) {
    this._occupancyRate = v;
  }

  get revenueYield(): number {
    return this._revenueYield;
  }

  set revenueYield(v: number) {
    this._revenueYield = v;
  }

  get revenueTrendPercent(): number {
    return this._revenueTrendPercent;
  }

  set revenueTrendPercent(v: number) {
    this._revenueTrendPercent = v;
  }

  get peakHours(): PeakHour[] {
    return this._peakHours;
  }

  set peakHours(v: PeakHour[]) {
    this._peakHours = v;
  }
}

export class Facility {
  private _name: string;
  private _sector: string;
  private _floor: string;
  private _lastUpdated: string;
  private _live: boolean;

  constructor(props: {
    name: string;
    sector: string;
    floor: string;
    lastUpdated: string;
    live: boolean;
  }) {
    this._name = props.name;
    this._sector = props.sector;
    this._floor = props.floor;
    this._lastUpdated = props.lastUpdated;
    this._live = props.live;
  }

  get name(): string {
    return this._name;
  }

  set name(v: string) {
    this._name = v;
  }

  get sector(): string {
    return this._sector;
  }

  set sector(v: string) {
    this._sector = v;
  }

  get floor(): string {
    return this._floor;
  }

  set floor(v: string) {
    this._floor = v;
  }

  get lastUpdated(): string {
    return this._lastUpdated;
  }

  set lastUpdated(v: string) {
    this._lastUpdated = v;
  }

  get live(): boolean {
    return this._live;
  }

  set live(v: boolean) {
    this._live = v;
  }
}

/*
  Root aggregate exposed by the OverviewStore to the view layer.

  It is intentionally a class even though it has no behavior beyond
  composition — keeping the same DDD shape across entities makes the
  codebase easier to reason about.
*/
export class ParkingSnapshot {
  private _facility: Facility;
  private _stats: ParkingStats;
  private _rows: ParkingRow[];

  constructor(props: {
    facility: Facility;
    stats: ParkingStats;
    rows: ParkingRow[];
  }) {
    this._facility = props.facility;
    this._stats = props.stats;
    this._rows = props.rows;
  }

  get facility(): Facility {
    return this._facility;
  }

  set facility(v: Facility) {
    this._facility = v;
  }

  get stats(): ParkingStats {
    return this._stats;
  }

  set stats(v: ParkingStats) {
    this._stats = v;
  }

  get rows(): ParkingRow[] {
    return this._rows;
  }

  set rows(v: ParkingRow[]) {
    this._rows = v;
  }
}
