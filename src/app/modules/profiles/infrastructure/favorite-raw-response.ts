/*
  Transport DTOs for the /favorites endpoint.

  FavoriteRawResource is the shape of one item as the API serializes it.
  We keep it separate from FavoriteRaw (the domain entity) so that any
  backend changes (field renames, type changes) only affect this file
  and FavoriteRawAssembler — the domain entity stays unchanged.

  FavoriteRawResponse is reserved for the case where the API wraps the
  array in a container object (e.g. { favorites: [...] }).
  JSON Server returns a plain array today so this interface is unused,
  but it is required by the BaseApiEndpoint contract.
*/
import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/*
  FavoriteRawResource mirrors the /favorites row in db.json exactly.
  All fields are plain primitive types — no domain types here.
  The assembler is responsible for converting them to domain types.
*/
export interface FavoriteRawResource extends BaseResource {
  id: string;
  clientId: string;
  parkingId: string;
  distanceMi: number;
  lastVisited: string;
}

/*
  Used only if the API wraps the array in an object.
  JSON Server returns a plain array so this is unused for now.
*/
export interface FavoriteRawResponse extends BaseResponse {
  favorites: FavoriteRawResource[];
}
