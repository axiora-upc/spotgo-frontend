/*
  Assembler that translates between the IncidentReport domain entity
  and the IncidentsResource / IncidentsResponse transport DTOs.
*/
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import {
  IncidentReport,
  IncidentSeverity,
  IncidentType,
} from '../domain/model/incident-report.entity';
import { IncidentsResource, IncidentsResponse } from './incidents-response';

export class IncidentReportAssembler
  implements BaseAssembler<IncidentReport, IncidentsResource, IncidentsResponse>
{
  toEntityFromResource(resource: IncidentsResource): IncidentReport {
    return new IncidentReport({
      id: resource.id,
      code: resource.code ?? resource.id,
      type: resource.type as IncidentType,
      spot: resource.spot,
      date: resource.date,
      time: resource.time,
      severity: resource.severity as IncidentSeverity,
    });
  }

  toResourceFromEntity(entity: IncidentReport): IncidentsResource {
    return {
      id: entity.id,
      code: entity.code,
      type: entity.type,
      spot: entity.spot,
      date: entity.date,
      time: entity.time,
      severity: entity.severity,
    } as IncidentsResource;
  }

  toEntitiesFromResponse(response: IncidentsResponse): IncidentReport[] {
    return response.incidents.map((r) => this.toEntityFromResource(r));
  }
}
