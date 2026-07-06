/*
  MonitoringApi is the aggregator that exposes every backend operation
  belonging to the monitoring bounded context.

  It instantiates the concrete endpoints and re-exports their methods
  with a domain-flavored vocabulary (getEmployees, addEmployee, etc.).
  The Store layer (and only the Store) talks to this class.
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../../shared/infrastructure/base-api';
import { EmployeesApiEndpoint } from './employees-api-endpoint';
import { ParkingsApiEndpoint } from './parkings-api-endpoint';
import type { ParkingResource } from './parkings-api-endpoint';
import { AnalyticsApiEndpoint } from './analytics-api-endpoint';
import { Employee } from '../domain/model/employee.entity';
import { ParkingAnalytics } from '../domain/model/analytics.entity';

export type { ParkingResource };

@Injectable({ providedIn: 'root' })
export class MonitoringApi extends BaseApi {
  private readonly employeesEndpoint: EmployeesApiEndpoint;
  private readonly parkingsEndpoint: ParkingsApiEndpoint;
  private readonly analyticsEndpoint: AnalyticsApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.employeesEndpoint = new EmployeesApiEndpoint(http);
    this.parkingsEndpoint = new ParkingsApiEndpoint(http);
    this.analyticsEndpoint = new AnalyticsApiEndpoint(http);
  }

  getEmployees(): Observable<Employee[]> {
    return this.employeesEndpoint.getAll();
  }

  addEmployee(employee: Employee): Observable<Employee> {
    return this.employeesEndpoint.create(employee);
  }

  updateEmployee(employee: Employee): Observable<Employee> {
    return this.employeesEndpoint.update(employee, employee.id);
  }

  deleteEmployee(id: string): Observable<void> {
    return this.employeesEndpoint.delete(id);
  }

  getParkings(): Observable<ParkingResource[]> {
    return this.parkingsEndpoint.getAll();
  }

  getAnalytics(parkingId: string): Observable<ParkingAnalytics> {
    return this.analyticsEndpoint.getByParkingId(parkingId);
  }
}
