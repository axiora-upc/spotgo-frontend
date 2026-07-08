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
import { environment } from '../../../../environments/environment';
import { EmployeesApiEndpoint } from './employees-api-endpoint';
import { ParkingsApiEndpoint } from './parkings-api-endpoint';
import type { ParkingResource } from './parkings-api-endpoint';
import { AnalyticsApiEndpoint } from './analytics-api-endpoint';
import { Employee } from '../domain/model/employee.entity';
import { ParkingAnalytics } from '../domain/model/analytics.entity';

export type { ParkingResource };

export interface DetectedSpotSummary {
  parkingId: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class MonitoringApi {
  private readonly employeesEndpoint: EmployeesApiEndpoint;
  private readonly parkingsEndpoint: ParkingsApiEndpoint;
  private readonly analyticsEndpoint: AnalyticsApiEndpoint;

  constructor(private readonly http: HttpClient) {
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

  getAnalytics(period: 'today' | 'last7' | 'custom', from?: string | null, to?: string | null): Observable<ParkingAnalytics> {
    return this.analyticsEndpoint.getByPeriod(period, from, to);
  }

  getDetectedSpots(): Observable<DetectedSpotSummary[]> {
    return this.http.get<DetectedSpotSummary[]>(`${environment.apiUrl}/detectedSpots`);
  }
}
