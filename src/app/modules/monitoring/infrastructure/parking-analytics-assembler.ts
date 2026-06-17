/*
  ParkingAnalyticsAssembler traduce entre ParkingResource (DTO de la
  API) y ParkingAnalytics (entidad de dominio).

  Implementa BaseAssembler para mantener el mismo contrato que el
  resto de ensambladores del proyecto. Como el endpoint de parking
  devuelve un objeto directo (no una colección envuelta),
  toEntitiesFromResponse no se usa en la práctica pero debe estar
  presente para satisfacer la interfaz.

  toResourceFromEntity no se usa en Analytics (solo lectura), pero
  también debe declararse por contrato.
*/
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { ParkingAnalytics } from '../domain/model/analytics.entity';
import { ParkingResource, ParkingResponse } from './analytics-response';

export class ParkingAnalyticsAssembler
  implements BaseAssembler<ParkingAnalytics, ParkingResource, ParkingResponse>
{
  /*
    Convierte el DTO de parking en la entidad de dominio ParkingAnalytics.
    Los spots más utilizados se inyectan después (ver AnalyticsApiEndpoint),
    por eso se inicializan como array vacío aquí.
  */
  toEntityFromResource(resource: ParkingResource): ParkingAnalytics {
    return new ParkingAnalytics({
      parkingId:             resource.id,
      parkingName:           resource.name,
      averageOccupancy:      resource.averageOccupancy,
      occupancyTrendPercent: resource.occupancyTrendPercent ?? 0,
      peakHour:              resource.peakHour,
      totalRevenue:          resource.totalRevenue,
      revenueTrendPercent:   resource.revenueTrendPercent ?? 0,
      systemStatus:          resource.systemStatus,
      totalCapacity:         resource.totalCapacity ?? resource.totalSpaces,
      efficiencyIndex:       resource.efficiencyIndex ?? 0,
      occupancyByHour:       [],
      weeklyTrends:          [],
      mostUtilizedSpots:     [],
      maintenanceSpotsCount: 0,
    });
  }

  /*
    Analytics es de solo lectura: nunca enviamos ParkingAnalytics
    de vuelta al servidor. Este método existe solo para satisfacer
    el contrato de BaseAssembler.
  */
  toResourceFromEntity(entity: ParkingAnalytics): ParkingResource {
    return {
      id:                    entity.parkingId,
      adminId:               '',
      name:                  entity.parkingName,
      totalSpaces:           entity.totalCapacity,
      availableSpaces:       0,
      averageOccupancy:      entity.averageOccupancy,
      occupancyTrendPercent: entity.occupancyTrendPercent,
      peakHour:              entity.peakHour,
      totalRevenue:          entity.totalRevenue,
      revenueTrendPercent:   entity.revenueTrendPercent,
      systemStatus:          entity.systemStatus,
      totalCapacity:         entity.totalCapacity,
      efficiencyIndex:       entity.efficiencyIndex,
    };
  }

  /*
    No se usa porque el endpoint /parkings/:id devuelve el objeto
    directo, no una colección envuelta. Se deja vacío por contrato.
  */
  toEntitiesFromResponse(_response: ParkingResponse): ParkingAnalytics[] {
    return [];
  }
}
