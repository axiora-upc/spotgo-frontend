/*
  This class handles all HTTP calls to /receipts.

  It inherits getAll(), getById(), update(), create(), and delete()
  from BaseApiEndpoint — no HTTP logic is written here.

  The only job of this class is to configure the parent with three things:
    1. The HttpClient tool
    2. The URL to call  →  http://localhost:3000/receipts
    3. The assembler that translates JSON ↔ Receipt entity

  Receipts are read-only from the client's perspective (no POST/PUT/DELETE
  exposed by PaymentApi), but BaseApiEndpoint provides those methods in
  case they are needed in the future.
*/
import { HttpClient } from '@angular/common/http';

/*
  environment.apiUrl resolves to:
    development → http://localhost:3000
    production  → the real server URL
  This avoids hardcoding the base URL anywhere in the codebase.
*/
import { environment } from '../../../../environments/environment';

import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { Receipt } from '../domain/model/receipt.entity';
import { ReceiptResource, ReceiptResponse } from './receipt-response';
import { ReceiptAssembler } from './receipt-assembler';

/*
  Generic type parameters tell BaseApiEndpoint:
    Receipt          → the domain entity to return to the store
    ReceiptResource  → the raw JSON object the API returns
    ReceiptResponse  → the shape if the API wraps the array in an object
    ReceiptAssembler → the translator between JSON and entity
*/
export class ReceiptsApiEndpoint extends BaseApiEndpoint<
  Receipt,
  ReceiptResource,
  ReceiptResponse,
  ReceiptAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.apiUrl}/receipts`,
      new ReceiptAssembler()
    );
  }
}
