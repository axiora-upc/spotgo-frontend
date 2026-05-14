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
      name: resource.name,
      role: resource.role as EmployeeRole,
      schedule: resource.schedule as EmployeeSchedule,
      shiftStart: resource.shiftStart,
      shiftEnd: resource.shiftEnd,
      bookingCode: resource.bookingCode,
      status: resource.status as EmployeeStatus,
    });
  }

  toResourceFromEntity(entity: Employee): EmployeesResource {
    return {
      id: entity.id,
      name: entity.name,
      role: entity.role,
      schedule: entity.schedule,
      shiftStart: entity.shiftStart,
      shiftEnd: entity.shiftEnd,
      bookingCode: entity.bookingCode,
      status: entity.status,
    } as EmployeesResource;
  }

  toEntitiesFromResponse(response: EmployeesResponse): Employee[] {
    return response.employees.map((r) => this.toEntityFromResource(r));
  }
}
