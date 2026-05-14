import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { SpotStatus, SpotType, SpotUtilization } from '../domain/model/analytics.entity';
import {
  SpotUtilizationResource,
  SpotUtilizationResponse,
} from './analytics-response';

export class SpotUtilizationAssembler
  implements
    BaseAssembler<SpotUtilization, SpotUtilizationResource, SpotUtilizationResponse>
{
  toEntityFromResource(resource: SpotUtilizationResource): SpotUtilization {
    return new SpotUtilization({
      id:               resource.id,
      spotId:           resource.spotId,
      spotName:         resource.spotName,
      zone:             resource.zone,
      type:             resource.type as SpotType,
      status:           resource.status as SpotStatus,
      dailyTurnover:    resource.dailyTurnover,
      peakUtilization:  resource.peakUtilization,
      revenueImpact:    resource.revenueImpact,
    });
  }

  /* Solo lectura: no se envía SpotUtilization al servidor. */
  toResourceFromEntity(entity: SpotUtilization): SpotUtilizationResource {
    return {
      id:               entity.id,
      parkingId:        '',
      spotId:           entity.spotId,
      spotName:         entity.spotName,
      zone:             entity.zone,
      type:             entity.type,
      status:           entity.status,
      dailyTurnover:    entity.dailyTurnover,
      peakUtilization:  entity.peakUtilization,
      revenueImpact:    entity.revenueImpact,
    };
  }

  /*
    La colección /spotUtilization se filtra por parkingId en la URL
    (?parkingId=prk-001), así que json-server devuelve un array directo.
    BaseApiEndpoint.getAll() lo maneja en su rama Array.isArray, por lo
    que este método no se llama en la práctica.
  */
  toEntitiesFromResponse(_response: SpotUtilizationResponse): SpotUtilization[] {
    return [];
  }
}
