/*
  This class handles all HTTP calls to /parkings within the favorites context.

  It reads the full parkings list so FavoritesStore can join it with
  the favorites list by parkingId. Only getAll() is used — parkings are
  read-only from the client's perspective.

  After construction, calling getAll() will do:
    GET http://localhost:3000/parkings → JSON[] → ParkingForFavorites[]
*/
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { ParkingForFavorites } from '../domain/model/parking-for-favorites.entity';
import {
  ParkingForFavoritesResource,
  ParkingForFavoritesResponse,
} from './parking-for-favorites-response';
import { ParkingForFavoritesAssembler } from './parking-for-favorites-assembler';

export class ParkingsApiEndpoint extends BaseApiEndpoint<
  ParkingForFavorites,
  ParkingForFavoritesResource,
  ParkingForFavoritesResponse,
  ParkingForFavoritesAssembler
> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/parkings`, new ParkingForFavoritesAssembler());
  }
}
