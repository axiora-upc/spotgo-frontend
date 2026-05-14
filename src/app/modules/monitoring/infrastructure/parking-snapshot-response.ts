/*
  Transport DTOs for the /parkingSnapshot endpoint.

  Note: ParkingSnapshotResource does NOT extend BaseResource because
  the parkingSnapshot is a singleton — it has no id field. We declare
  the nested shapes inline so the assembler can map them one by one.
*/

export interface ParkingSpotResource {
  id: string;
  status: string;
}

export interface ParkingRowResource {
  id: string;
  spots: ParkingSpotResource[];
}

export interface PeakHourResource {
  hour: string;
  intensity: number;
}

export interface ParkingStatsResource {
  totalSpaces: number;
  currentlyAvailable: number;
  availableTrendPercent: number;
  occupancyRate: number;
  revenueYield: number;
  revenueTrendPercent: number;
  peakHours: PeakHourResource[];
}

export interface FacilityResource {
  name: string;
  sector: string;
  floor: string;
  lastUpdated: string;
  live: boolean;
}

export interface ParkingSnapshotResource {
  facility: FacilityResource;
  stats: ParkingStatsResource;
  rows: ParkingRowResource[];
}
