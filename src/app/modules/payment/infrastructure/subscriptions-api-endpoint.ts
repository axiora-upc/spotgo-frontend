/*
  This class handles all HTTP calls to /subscriptions.

  It does NOT write any HTTP logic — it inherits getAll(), getById(),
  update(), delete() and create() from BaseApiEndpoint (the parent class).

  The only job of this class is to configure the parent with 3 things:
    1. The HTTP tool (HttpClient)
    2. The URL to call
    3. The assembler (translator between raw JSON and domain entity)
*/
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/*
  environment.apiUrl builds the base URL automatically:
    - In development → http://localhost:3000
    - In production  → the real server URL
  So we never hardcode the URL directly in the code.
*/
import { environment } from '../../../../environments/environment';

/*
  BaseApiEndpoint is the parent class. It contains all the HTTP logic.
  By extending it, this class inherits getAll(), getById(), update(), etc.
  without writing any of that code here.
*/
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { Subscription } from '../domain/model/subscription.entity';
import { SubscriptionResource, SubscriptionResponse } from './subscription-response';
import { SubscriptionAssembler } from './subscription-assembler';

/*
  The <...> are called generics — they are like parameters but for types.
  Here we tell the parent class:
    - Subscription        → the final typed object to return to the store
    - SubscriptionResource → the raw JSON object the API returns
    - SubscriptionResponse → the shape if the API wraps the array in an object
    - SubscriptionAssembler → the class that translates between JSON and entity
*/
export class SubscriptionsApiEndpoint extends BaseApiEndpoint<
  Subscription,
  SubscriptionResource,
  SubscriptionResponse,
  SubscriptionAssembler
> {
  constructor(http: HttpClient) {
    /*
      super() passes the 3 required things to the parent (BaseApiEndpoint)
      so it can start working. Without super(), the parent does not know
      which URL to call or how to translate the response.

        http is the tool to make HTTP calls
        environment.apiUrl/subscriptions builds http://localhost:3000/subscriptions
        new SubscriptionAssembler() the translator to convert JSON → Subscription

      After this, calling getAll() will automatically do:
        GET http://localhost:3000/subscriptions → JSON → Subscription
      And calling getById('sub-001') will do:
        GET http://localhost:3000/subscriptions/sub-001 → JSON → Subscription
    */
    super(
      http,
      `${environment.apiUrl}/subscriptions`,
      new SubscriptionAssembler()
    );
  }

  patchSavedThisMonth(id: string, savedThisMonth: number, savingsMonth: string): Observable<void> {
    return this.http.patch<void>(`${this.endpointUrl}/${id}/savings`, { savedThisMonth, savingsMonth });
  }
}
