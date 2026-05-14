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
import { IncidentsApiEndpoint } from './incidents-api-endpoint';
import { ParkingSnapshotApiEndpoint } from './parking-snapshot-api-endpoint';
import { Employee } from '../domain/model/employee.entity';
import { IncidentReport } from '../domain/model/incident-report.entity';
import { ParkingSnapshot } from '../domain/model/parking-spot.entity';

@Injectable({ providedIn: 'root' })
export class MonitoringApi extends BaseApi {
  private readonly employeesEndpoint: EmployeesApiEndpoint;
  private readonly incidentsEndpoint: IncidentsApiEndpoint;
  private readonly parkingSnapshotEndpoint: ParkingSnapshotApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.employeesEndpoint = new EmployeesApiEndpoint(http);
    this.incidentsEndpoint = new IncidentsApiEndpoint(http);
    this.parkingSnapshotEndpoint = new ParkingSnapshotApiEndpoint(http);
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

  getIncidentReports(): Observable<IncidentReport[]> {
    return this.incidentsEndpoint.getAll();
  }

  getParkingSnapshot(): Observable<ParkingSnapshot> {
    return this.parkingSnapshotEndpoint.get();
  }

  touchParkingSnapshotLastUpdated(): Observable<ParkingSnapshot> {
    return this.parkingSnapshotEndpoint.touchLastUpdated();
  }
}
