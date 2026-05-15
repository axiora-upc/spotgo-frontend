import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ParkingResource {
  id: string;
  adminId: string;
  name: string;
  address: string;
  city: string;
  totalSpaces: number;
  availableSpaces: number;
  totalFloors: number;
  averageOccupancy: number;
  peakHour: string;
  totalRevenue: number;
  systemStatus: string;
}

export class ParkingsApiEndpoint {
  constructor(private http: HttpClient) {}

  getAll(): Observable<ParkingResource[]> {
    return this.http.get<ParkingResource[]>(`${environment.apiUrl}/parkings`);
  }
}