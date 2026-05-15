/*
  Assembler that translates between the FavoriteRaw domain entity and the
  FavoriteRawResource / FavoriteRawResponse transport DTOs.

  This is the only file that knows about both worlds at the same time.
  The domain entity (FavoriteRaw) does not know the API exists, and the
  HTTP endpoint only deals with Resources. The assembler bridges them.

  Note: toResourceFromEntity is used by BaseApiEndpoint.delete() internally
  but favorites are only ever deleted by id — no body is sent — so this
  method is effectively unused. It is implemented to satisfy the
  BaseAssembler contract.
*/
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { FavoriteRaw } from '../domain/model/favorite-raw.entity';
import { FavoriteRawResource, FavoriteRawResponse } from './favorite-raw-response';

export class FavoriteRawAssembler
  implements BaseAssembler<FavoriteRaw, FavoriteRawResource, FavoriteRawResponse>
{
  /*
    Converts one raw API resource into a FavoriteRaw domain entity.
    Called by BaseApiEndpoint.getAll() for each item in the array
    the /favorites endpoint returns.
  */
  toEntityFromResource(r: FavoriteRawResource): FavoriteRaw {
    return new FavoriteRaw(r.id, r.clientId, r.parkingId, r.distanceMi, r.lastVisited);
  }

  /*
    Converts a FavoriteRaw entity back into a resource.
    Required by the BaseAssembler contract but not called in practice
    because favorites are removed via delete(id) which sends no body.
  */
  toResourceFromEntity(e: FavoriteRaw): FavoriteRawResource {
    return {
      id: e.id,
      clientId: e.clientId,
      parkingId: e.parkingId,
      distanceMi: e.distanceMi,
      lastVisited: e.lastVisited,
    };
  }

  /*
    Converts a wrapped API response into an array of entities.
    JSON Server returns a plain array today so this method is
    only called if the API ever wraps the response in an object.
  */
  toEntitiesFromResponse(response: FavoriteRawResponse): FavoriteRaw[] {
    return response.favorites.map(r => this.toEntityFromResource(r));
  }
}
