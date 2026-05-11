/*
  We import BaseEntity to use it as the base format for our domain entities.
  We import BaseResource and BaseResponse to define the base formats used
  when communicating with API endpoints.

  endpoint = URL of the API
  response = Complete data received from the API after making a request
  resource = Each item/object within that response
*/

import {BaseEntity} from '../domain/model/base-entity';
import {BaseResource, BaseResponse} from './base-response';

/*
    This BaseAssembler interface says that any assembler that we create in the future must have these 3 functions.
*/

export interface BaseAssembler<TEntity extends BaseEntity, TResource extends BaseResource,TResponse extends BaseResponse> {
  
    /*
        TEntity is a placeholder for the type of the domain entity that we want to work with.
        TResource is a placeholder for the type of the resource that we receive from the API.
        TResponse is a placeholder for the type of the complete response that we receive from the API.
    */


    /*
    Give me one resource from the API and I will return one domain entity.
    Use this when the API returns a direct array of resources,
    because each resource in that array must be converted into an entity.
    */
    toEntityFromResource(resource: TResource): TEntity;

    /*
    Give me one domain entity from my app and I will return one resource
    to send to the API.
    Use this when creating or updating data.
    */
    toResourceFromEntity(entity: TEntity): TResource;

    /*
    Give me a complete API response object and I will return a list of domain entities.
    Use this when the API does not return a direct array, but an object that contains
    the array inside a property such as content, data, results, etc.
    */
    toEntitiesFromResponse(response: TResponse): TEntity[];

}
