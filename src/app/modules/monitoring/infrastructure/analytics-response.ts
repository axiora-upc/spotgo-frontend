/*
  Transport DTOs para los endpoints /parkings/:id y /spotUtilization
  que alimentan la vista Analytics.

  ParkingResource: representa el objeto parking tal como lo devuelve
  json-server. Solo declaramos los campos que usa la vista Analytics;
  los campos extra del servidor se ignoran.

  SpotUtilizationResource: representa cada fila de la colección
  /spotUtilization filtrada por parkingId.
*/

import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/* ----- Parking ----- */

export interface OccupancyPointResource {
  hour: string;
  intensity: number;
}

export interface WeeklyTrendPointResource {
  day: string;
  value: number;
}

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
  occupancyByHour: OccupancyPointResource[];
  weeklyTrends: WeeklyTrendPointResource[];
}

/*
  ParkingResponse es necesario para satisfacer el contrato de
  BaseAssembler aunque el endpoint /parkings/:id devuelve el objeto
  directo (no envuelto). toEntitiesFromResponse nunca se llama en
  este flujo, pero debe existir para compilar.
*/
export interface ParkingResponse extends BaseResponse {
  parkings: ParkingResource[];
}

/* ----- SpotUtilization ----- */

export interface SpotUtilizationResource extends BaseResource {
  id: string;
  parkingId: string;
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
  spotUtilization: SpotUtilizationResource[];
}
