/*
  ReceiptResource is the shape of one receipt as the API returns it.

  Keeping it separate from the Receipt domain entity means that if the
  backend renames a field (e.g. "locationName" → "parkingName") we only
  change this file and the assembler — the entity and the rest of the app
  stay untouched.

  ReceiptResponse covers the case where the API wraps the list in a
  container object (e.g. { receipts: [...] }). JSON Server today returns
  a plain array, so this interface is here only to satisfy the
  BaseApiEndpoint generic contract.
*/
import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/*
  Raw JSON shape of a receipt as it comes from the API.
  Every field maps 1-to-1 to what backend stores in db.json.
*/
export interface ReceiptResource extends BaseResource {
  id: string;
  clientId: string;
  reservationId: string;
  invoiceNumber: string;
  locationName: string;
  date: string;
  durationHours: number;
  durationMinutes: number;
  paymentMethod: string;
  amount: number;
  status: string;   // raw string from the API; cast to ReceiptStatus in the assembler
}

/*
  Wrapper shape, kept for BaseApiEndpoint compatibility.
  Not used as long as backend returns a plain array.
*/
export interface ReceiptResponse extends BaseResponse {
  receipts: ReceiptResource[];
}
