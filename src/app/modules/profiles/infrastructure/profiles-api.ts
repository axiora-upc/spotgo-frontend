import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminApiEndpoint } from './admin-api-endpoint';
import { Admin } from '../domain/model/admin.entity';

/*
  ProfilesApi is the single entry point for all backend operations
  in the profiles bounded context.

  The Store (and only the Store) talks to this class.
*/
@Injectable({ providedIn: 'root' })
export class ProfilesApi {
  private readonly adminEndpoint: AdminApiEndpoint;

  constructor(http: HttpClient) {
    this.adminEndpoint = new AdminApiEndpoint(http);
  }

  getAdminById(id: string): Observable<Admin> {
    return this.adminEndpoint.getById(id);
  }

  updateAdmin(admin: Admin): Observable<Admin> {
    return this.adminEndpoint.update(admin, admin.id);
  }
}
