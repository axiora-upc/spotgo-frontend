/*
  Assembler that translates between the Employee domain entity and the
  EmployeesResource / EmployeesResponse transport DTOs.

  This is the only file allowed to know about both worlds at the same
  time. The domain (Employee) does not know the API exists, and the
  HTTP endpoint only deals with Resources. The assembler bridges them.
*/
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import {
  Employee,
  EmployeeRole,
  EmployeeSchedule,
  EmployeeStatus,
} from '../domain/model/employee.entity';
import { EmployeesResource, EmployeesResponse } from './employees-response';

export class EmployeeAssembler
  implements BaseAssembler<Employee, EmployeesResource, EmployeesResponse>
{
  toEntityFromResource(resource: EmployeesResource): Employee {
    return new Employee({
      id: resource.id,
      parkingId: resource.parkingId ?? '',
      name: `${resource.firstName} ${resource.lastName}`,
      role: resource.role as EmployeeRole,
      schedule: resource.schedule as EmployeeSchedule,
      shiftStart: resource.shiftStart,
      shiftEnd: resource.shiftEnd,
      assignedSpot: resource.assignedSpot ?? null,
      status: resource.status as EmployeeStatus,
    });
  }

  toResourceFromEntity(entity: Employee): EmployeesResource {
    const parts = entity.name.trim().split(' ');
    const firstName = parts[0] ?? '';
    const lastName = parts.slice(1).join(' ');
    return {
      id: entity.id,
      parkingId: entity.parkingId,
      firstName,
      lastName,
      role: entity.role,
      schedule: entity.schedule,
      shiftStart: entity.shiftStart,
      shiftEnd: entity.shiftEnd,
      assignedSpot: entity.assignedSpot,
      status: entity.status,
    } as EmployeesResource;
  }

  toEntitiesFromResponse(response: EmployeesResponse): Employee[] {
    return response.employees.map((r) => this.toEntityFromResource(r));
  }
}
