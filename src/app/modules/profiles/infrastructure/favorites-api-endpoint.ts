/*
  This class handles all HTTP calls to /favorites.

  It does NOT write any HTTP logic — it inherits getAll(), getById(),
  update(), delete() and create() from BaseApiEndpoint.

  The only job of this class is to configure the parent with 3 things:
    1. The HTTP tool (HttpClient)
    2. The URL to call  →  http://localhost:3000/favorites
    3. The assembler    →  FavoriteRawAssembler (translates JSON ↔ FavoriteRaw)

  After this, calling getAll() will automatically do:
    GET http://localhost:3000/favorites → JSON[] → FavoriteRaw[]
  And calling delete('fav-001') will do:
    DELETE http://localhost:3000/favorites/fav-001
*/
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { FavoriteRaw } from '../domain/model/favorite-raw.entity';
import { FavoriteRawResource, FavoriteRawResponse } from './favorite-raw-response';
import { FavoriteRawAssembler } from './favorite-raw-assembler';

export class FavoritesApiEndpoint extends BaseApiEndpoint<
  FavoriteRaw,
  FavoriteRawResource,
  FavoriteRawResponse,
  FavoriteRawAssembler
> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/favorites`, new FavoriteRawAssembler());
  }
}
