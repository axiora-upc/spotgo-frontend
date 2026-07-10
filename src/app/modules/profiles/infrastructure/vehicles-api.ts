import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface VehicleResource {
  id: string;
  clientId: string;
  licensePlate: string;
  vehicleType: string;
  brand: string;
  model: string;
}

export interface UpdateVehiclePayload {
  licensePlate: string;
  vehicleType: string;
  brand: string;
  model: string;
}

export interface CreateVehiclePayload extends UpdateVehiclePayload {
  clientId: string;
}

@Injectable({ providedIn: 'root' })
export class VehiclesApi {
  constructor(private readonly http: HttpClient) {}

  getCurrentClientVehicle(): Observable<VehicleResource | null> {
    return this.http.get<VehicleResource[]>(`${environment.apiUrl}/vehicles`).pipe(
      map((vehicles) => vehicles[0] ?? null),
      catchError((err) => throwError(() => this.toError(err, 'profiles.vehicle.errors.load')))
    );
  }

  createVehicle(payload: CreateVehiclePayload): Observable<VehicleResource> {
    return this.http.post<VehicleResource>(`${environment.apiUrl}/vehicles`, payload).pipe(
      catchError((err) => throwError(() => this.toError(err, 'profiles.vehicle.errors.save')))
    );
  }

  updateVehicle(vehicleId: string, payload: UpdateVehiclePayload): Observable<VehicleResource> {
    return this.http.patch<VehicleResource>(`${environment.apiUrl}/vehicles/${vehicleId}`, payload).pipe(
      catchError((err) => throwError(() => this.toError(err, 'profiles.vehicle.errors.save')))
    );
  }

  private toError(err: unknown, fallback: string): Error {
    const httpErr = err as { error?: { details?: string; message?: string }; message?: string } | undefined;
    const message = httpErr?.error?.details ?? httpErr?.error?.message ?? httpErr?.message ?? fallback;
    return new Error(message);
  }
}
