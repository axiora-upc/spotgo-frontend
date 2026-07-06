/*
  PlanesClienteService is the service responsible for fetching subscription
  plan data from the fake API (backend).

  It lives in infrastructure/ because infrastructure is the layer that
  talks to the outside world: APIs, databases, external services.
  The presentation layer (components) never talks to the API directly —
  it always goes through a service like this one.
*/

/*
  Injectable marks this class as something Angular can inject into other classes.

  providedIn: 'root' means Angular creates one single instance of this service
  for the entire application (singleton). Every component that asks for it
  gets the same instance.
*/
import { Injectable } from '@angular/core';

/*
  HttpClient is Angular's built-in tool for making HTTP requests.
  We use it to call GET, POST, PUT, DELETE on our API.

  We import it from @angular/common/http.
*/
import { HttpClient } from '@angular/common/http';

/*
  Observable is a value that arrives in the future — like a promise,
  but more powerful. When HttpClient makes a GET request, it does not
  return the data immediately. Instead it returns an Observable that
  will emit the data once the API responds.

  Components subscribe to Observables to receive that data.
*/
import { Observable } from 'rxjs';

/*
  We import the environment object.
  Angular replaces this file at build time:
  - In development → it uses environment.development.ts (apiUrl = localhost:3000)
  - In production  → it uses environment.ts (the real API URL)

  This way our code never has a hardcoded URL — it always reads from environment.
*/
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClientPlansService {

  /*
    We inject HttpClient via the constructor.
    Angular reads the type (HttpClient) and automatically provides the instance.
    We don't create it with 'new HttpClient()' — Angular does that for us.
  */
  constructor(private http: HttpClient) {}

  /*
    getAll() sends an HTTP GET request to /planes_cliente on our fake API.

    The URL is built by combining environment.apiUrl with the endpoint path.
    In development: 'http://localhost:3000/planes_cliente'

    The <any[]> tells TypeScript that the API will return an array of objects.
    We use 'any' here because this is a quick test — in a real feature
    we would define a proper interface or entity.

    It returns Observable<any[]> — the component will subscribe to this
    to receive the array when the API responds.
  */
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/clientPlans`);
  }
}
