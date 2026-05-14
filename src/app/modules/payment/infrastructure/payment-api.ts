/*
  PaymentApi is the single entry point for all HTTP operations
  in the payment module.

  The store (application layer) only talks to this class —
  it never touches the endpoints directly.
*/

/*
  Injectable tells Angular: "create and manage this class for me".
  Without this, the store cannot ask Angular for an instance of PaymentApi.

  providedIn: 'root' means Angular creates ONE single instance
  for the entire app and shares it with everyone who asks for it.
*/
import { Injectable } from '@angular/core';

/*
  HttpClient is Angular's tool to make HTTP requests.
  Angular injects it automatically into the constructor
  because it also has @Injectable.
*/
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

/*
  BaseApi is an empty abstract class — it exists only to follow
  the same pattern used in MonitoringApi and other modules.
*/
import { BaseApi } from '../../../shared/infrastructure/base-api';

/*
  Each endpoint handles HTTP calls for one resource.
  They do NOT have @Injectable, so Angular cannot inject them directly.
  PaymentApi creates them manually with 'new' and passes them HttpClient.
*/
import { SubscriptionsApiEndpoint } from './subscriptions-api-endpoint';
import { ClientPlansApiEndpoint } from './client-plans-api-endpoint';
import { Subscription } from '../domain/model/subscription.entity';
import { ClientPlan } from '../domain/model/client-plan.entity';

@Injectable({ providedIn: 'root' })
export class PaymentApi extends BaseApi {

  /*
    PaymentApi holds each endpoint as a private field.
    Only this class can use them — the store never touches them directly.
  */
  private readonly subscriptionsEndpoint: SubscriptionsApiEndpoint;
  private readonly clientPlansEndpoint: ClientPlansApiEndpoint;

  /*
    Angular calls this constructor automatically and passes HttpClient.
    We then pass that HttpClient to each endpoint so they can make HTTP calls.

    super() is required because PaymentApi extends BaseApi.
  */
  constructor(http: HttpClient) {
    super();
    this.subscriptionsEndpoint = new SubscriptionsApiEndpoint(http);
    this.clientPlansEndpoint = new ClientPlansApiEndpoint(http);
  }

  /*
    The methods below are what the store calls.
    They have domain-friendly names and delegate to the correct endpoint.
  */

  getSubscriptions(): Observable<Subscription[]> {
    return this.subscriptionsEndpoint.getAll();
  }

  getSubscriptionById(id: string): Observable<Subscription> {
    return this.subscriptionsEndpoint.getById(id);
  }

  updateSubscription(subscription: Subscription): Observable<Subscription> {
    return this.subscriptionsEndpoint.update(subscription, subscription.id);
  }

  /*
    Client plans are read-only — the client can view and select them
    but never create, edit or delete them from the frontend.
    So only getAll() is exposed here.
  */
  getClientPlans(): Observable<ClientPlan[]> {
    return this.clientPlansEndpoint.getAll();
  }
}
