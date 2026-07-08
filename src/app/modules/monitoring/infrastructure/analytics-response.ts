import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/* ----- Parking ----- */

export interface ParkingResource extends BaseResource {
  id: string;
  adminId: string;
  name: string;
  totalSpaces: number;
  availableSpaces: number;
  averageOccupancy: number;
  occupancyTrendPercent: number;
  peakHour: string;
  totalRevenue: number;
  revenueTrendPercent: number;
  systemStatus: string;
  totalCapacity: number;
  efficiencyIndex: number;
}

export interface ParkingResponse extends BaseResponse {
  parkings: ParkingResource[];
}

/* ----- OccupancyByHour ----- */

export interface OccupancyPointResource extends BaseResource {
  id: string;
  parkingId: string;
  hour: string;
  intensity: number;
}

/* ----- WeeklyTrends ----- */

export interface WeeklyTrendPointResource extends BaseResource {
  id: string;
  parkingId: string;
  day: string;
  value: number;
}

/* ----- ParkingSpots (analytics) ----- */

export interface SpotUtilizationResource extends BaseResource {
  id: string;
  spotId: string;
  spotName: string;
  zone: string;
  type: string;
  status: string;
  dailyTurnover: number;
  peakUtilization: number;
  revenueImpact: number;
}

export interface SpotUtilizationResponse extends BaseResponse {
  parkingSpots: SpotUtilizationResource[];
}

export interface AnalyticsResource extends BaseResource {
  id: string;
  adminId: string;
  name: string;
  totalSpaces: number;
  availableSpaces: number;
  averageOccupancy: number;
  occupancyTrendPercent: number;
  peakHour: string;
  totalRevenue: number;
  revenueTrendPercent: number;
  systemStatus: string;
  totalCapacity: number;
  efficiencyIndex: number;
  maintenanceSpotsCount: number;
  occupancyByHour: OccupancyPointResource[];
  weeklyTrends: WeeklyTrendPointResource[];
  mostUtilizedSpots: SpotUtilizationResource[];
}
