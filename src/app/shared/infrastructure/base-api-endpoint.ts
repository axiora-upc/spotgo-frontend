/*
  We import BaseEntity to use it as the base format for our domain entities.
  We import BaseResource and BaseResponse to define the base formats used
  when communicating with API endpoints.
  We import BaseAssembler to define the methods that any assembler must implement
  to convert between entities, resources, and responses.

  endpoint = Specific URL or path of the API.
  response = Complete data received from the API after making a request.
  resource = Individual item/object received from or sent to the API.
*/
import { BaseEntity } from '../domain/model/base-entity';
import { BaseResource, BaseResponse } from './base-response';
import { BaseAssembler } from './base-assembler';

/*
  We import HttpClient to make HTTP requests to the API.
  It allows us to perform operations such as GET, POST, PUT, and DELETE.

  We import HttpErrorResponse to represent and handle errors that may occur
  during HTTP requests, such as 404 Not Found or 500 Server Error.

  We import Observable because Angular HTTP methods, such as http.get(),
  return Observables. An Observable represents a value that will be received
  in the future when the API responds.

  We import map to transform the data emitted by an Observable.
  For example, we can transform a resource received from the API into
  a domain entity used by our application.

  We import catchError to catch errors that happen inside an Observable
  during an HTTP request.

  We import throwError to return an error as an Observable, so the error
  can continue through the RxJS flow and be handled by the application.
*/

import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, map, Observable, throwError} from 'rxjs';

/*
  The <> are similar to parameters, but they are not data parameters. They are type parameters.
*/

export abstract class BaseApiEndpoint< TEntity extends BaseEntity,
  TResource extends BaseResource,
  TResponse extends BaseResponse,
  TAssembler extends BaseAssembler<TEntity, TResource, TResponse>>{

  /*
  This protected constructor means that this class cannot be instantiated directly,
  but only through a subclass that extends it.

  The function is inicialized with the HttpClient to make HTTP requests,
  the endpointUrl which is the URL of the API endpoint,
  and the assembler which is responsible for converting
  between entities, resources, and responses.
  */

  protected constructor(
    protected http: HttpClient,
    protected endpointUrl: string,
    protected assembler: TAssembler
  ) {  }


  /*
  This method handleError helps to handle errors that may occur during HTTP requests.
  It takes an operation string as a parameter, which describes the operation being performed (e.g., "fetching data", "creating resource").
  */

  protected handleError(operation: string){

    /*
    handleError receives the name of the operation that failed.

    It returns a function because catchError expects a function.
    That returned function receives the real HTTP error when the request fails.

    Observable<never> means this function does not return a successful value.
    It only returns an error inside the Observable flow.
    */

    return (error: HttpErrorResponse): Observable<never> => {
      let errorMessage = operation;
      const errorCode = typeof error.error?.code === 'string' ? error.error.code : null;
      const apiDetails = typeof error.error?.details === 'string' && error.error.details.trim().length > 0
        ? error.error.details.trim()
        : typeof error.error?.message === 'string' && error.error.message.trim().length > 0
          ? error.error.message.trim()
          : null;
      if (error.status === 404) {
        errorMessage = `Resource not found: ${operation}`;
      } else if (apiDetails) {
        errorMessage = apiDetails;
      } else if (error.error instanceof ErrorEvent) {
        errorMessage = `An error occurred ${operation}: ${error.error.message}`;
      } else {
        errorMessage = `${operation}: ${error.statusText || 'Unexpected error'}`;
      }
      const apiError = new Error(errorMessage) as Error & { status?: number; code?: string };
      apiError.status = error.status;
      apiError.code = errorCode ?? undefined;
      return throwError(()=> apiError);
    }
  }
  /*
  This method delete a resource from the API by its ID.
  It sends an HTTP DELETE request to the endpoint URL
  with the specified ID.
  If the request is successful,
  it returns an Observable that completes without
  emitting any value (void).
  If there is an error during the request,
  it catches the error and returns an Observable
  that emits an error with a descriptive message
  using the handleError method.
  */

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.endpointUrl}/${id}`).pipe(
      catchError(this.handleError('Failed to delete entity'))
    );
  }
  /*
  This method updates a resource in the API by its ID.
  It receives a domain entity with the updated data and an ID.

  First, it converts the domain entity into a resource using the assembler,
  because the API expects to receive a resource.
  Then, it sends an HTTP PATCH request to the endpoint URL with the specified
  ID, sending the resource as the request body.
  If the request is successful, the API returns the updated resource.
  Then, map converts that updated resource back into a domain entity.

  If there is an error during the request,
  catchError catches the error and uses handleError
  to return an Observable with a descriptive error message.

  NOTE: this used to send a PUT request, which is a full replace of the
  resource. That silently deleted any field the current TResource does not
  model. This bit us for real: AdminResource (profiles module) has no
  "password" field, so saving a change in Settings for a user who had
  registered through IAM overwrote their /users row and wiped their
  password, permanently locking them out (the account still existed and
  the email was right, but the password field was gone). PATCH only
  merges the fields we actually send, so unrelated fields owned by other
  bounded contexts sharing the same resource are preserved.
  */

  update(entity: TEntity, id: string | number): Observable<TEntity> {
    const resource =  this.assembler.toResourceFromEntity(entity);
    return this.http.patch<TResource>(`${this.endpointUrl}/${id}`, resource).pipe(
      map(updated => this.assembler.toEntityFromResource(updated)),
      catchError(this.handleError('Failed to update entity'))
    );
  }

  /*
  Creates a new resource in the API.

  It receives a domain entity with the data to create.

  First, it converts the domain entity into a resource using the assembler,
  because the API expects to receive a resource.
  Then, it sends an HTTP POST request to the endpoint URL,
  sending the resource as the request body.
  If the request is successful, the API returns the created resource.
  Then, map converts that created resource back into a domain entity.
  */

  create(entity: TEntity): Observable<TEntity> {
    const resource =  this.assembler.toResourceFromEntity(entity);
    return this.http.post<TResource>(this.endpointUrl, resource).pipe(
      map(created => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create entity'))
    );
  }

  /*
  Gets all resources from the API.

  It sends an HTTP GET request to the endpoint URL.
  The API response can have two possible formats:

  1. A direct array of resources:
      [
      { id: 1 },
      { id: 2 }
      ]

  2. A complete response object that contains the resources:
      {
      content: [
          { id: 1 },
          { id: 2 }
      ]
      }

  The RxJS map transforms the API response into the final value
  that this method must return: a list of domain entities.

  If the response is a direct array, Array.isArray(response) returns true.
  Then, response.map(...) is used to convert each resource in the array
  into a domain entity using the assembler.

  If the response is not an array, it is treated as a complete response object.
  Then, the assembler converts that complete response into a list of domain entities.

  If there is an error during the request,
  catchError catches the error and uses handleError
  to return an Observable with a descriptive error message.
  */


  getAll(): Observable<TEntity[]> {
    return this.http.get<TResponse | TResource[]>(this.endpointUrl).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response.map(resource => this.assembler.toEntityFromResource(resource));
        }
        return this.assembler.toEntitiesFromResponse(response as TResponse);
      }),
      catchError(this.handleError('Failed to get entities'))
    );
  }

  /*
  Gets one resource from the API by its ID.

  It receives an ID as a parameter.

  It sends an HTTP GET request to the endpoint URL with the specified ID.

  This method expects the API to return one direct resource, not an array
  and not a complete response object.

  Example of the expected API response:
      {
      id: 6,
      title: "Advanced TypeScript",
      description: "Explore advanced concepts in TypeScript programming",
      categoryId: 3
      }

  The RxJS map transforms the resource received from the API
  into a domain entity using the assembler.
  */

  getById(id: string | number): Observable<TEntity> {
    return this.http.get<TResource>(`${this.endpointUrl}/${id}`).pipe(
      map(resource => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to get entity'))
    );
  }


}
