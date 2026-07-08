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
  Each endpoint handles HTTP calls for one resource.
  They do NOT have @Injectable, so Angular cannot inject them directly.
  PaymentApi creates them manually with 'new' and passes them HttpClient.
*/
import { SubscriptionsApiEndpoint } from './subscriptions-api-endpoint';
import { ClientPlansApiEndpoint } from './client-plans-api-endpoint';
import { ReceiptsApiEndpoint } from './receipts-api-endpoint';
import { Subscription } from '../domain/model/subscription.entity';
import { ClientPlan } from '../domain/model/client-plan.entity';
import { Receipt } from '../domain/model/receipt.entity';

@Injectable({ providedIn: 'root' })
export class PaymentApi {

  /*
    PaymentApi holds each endpoint as a private field.
    Only this class can use them — the store never touches them directly.
  */
  private readonly subscriptionsEndpoint: SubscriptionsApiEndpoint;
  private readonly clientPlansEndpoint: ClientPlansApiEndpoint;
  private readonly receiptsEndpoint: ReceiptsApiEndpoint;

  /*
    Angular calls this constructor automatically and passes HttpClient.
    We then pass that HttpClient to each endpoint so they can make HTTP calls.
  */
  constructor(http: HttpClient) {
    this.subscriptionsEndpoint = new SubscriptionsApiEndpoint(http);
    this.clientPlansEndpoint = new ClientPlansApiEndpoint(http);
    this.receiptsEndpoint = new ReceiptsApiEndpoint(http);
  }

  /*
    The methods below are what the store calls.
    They have domain-friendly names and delegate to the correct endpoint.
  */

  createSubscription(subscription: Subscription): Observable<Subscription> {
    return this.subscriptionsEndpoint.create(subscription);
  }

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

  /*
    Receipts are read-only from the client's perspective.
    The store filters the full list by clientId after loading.
  */
  getReceipts(): Observable<Receipt[]> {
    return this.receiptsEndpoint.getAll();
  }

  /*
    Creates a new receipt in the database via POST.
  */
  addReceipt(receipt: Receipt): Observable<Receipt> {
    return this.receiptsEndpoint.create(receipt);
  }

  patchSubscriptionSaved(id: string, savedThisMonth: number, savingsMonth: string): Observable<void> {
    return this.subscriptionsEndpoint.patchSavedThisMonth(id, savedThisMonth, savingsMonth);
  }

  deleteReceiptByCode(code: string): Observable<void> {
    return this.receiptsEndpoint.deleteByBookingCode(code);
  }
}
