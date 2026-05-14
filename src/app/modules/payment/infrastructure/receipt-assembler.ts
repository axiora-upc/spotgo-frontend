/*
  Assembler that translates between the Receipt domain entity and the
  ReceiptResource / ReceiptResponse transport DTOs.

  This is the only file that knows about both worlds at the same time:
    - The domain (Receipt) does not know the API exists.
    - The HTTP endpoint only deals with ReceiptResource.
  The assembler bridges them without coupling either side.
*/
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { Receipt, ReceiptStatus } from '../domain/model/receipt.entity';
import { ReceiptResource, ReceiptResponse } from './receipt-response';

export class ReceiptAssembler
  implements BaseAssembler<Receipt, ReceiptResource, ReceiptResponse>
{
  /*
    Converts one raw API resource into a Receipt domain entity.

    status comes as a plain string from the API (e.g. "paid").
    We cast it to ReceiptStatus — the same pattern used by
    SubscriptionAssembler for its status field.
  */
  toEntityFromResource(resource: ReceiptResource): Receipt {
    return new Receipt({
      id:              resource.id,
      clientId:        resource.clientId,
      invoiceNumber:   resource.invoiceNumber,
      locationName:    resource.locationName,
      date:            resource.date,
      durationHours:   resource.durationHours,
      durationMinutes: resource.durationMinutes,
      paymentMethod:   resource.paymentMethod,
      bookingCode:     resource.bookingCode,
      amount:          resource.amount,
      status:          resource.status as ReceiptStatus,
    });
  }

  /*
    Converts a Receipt domain entity back into a resource to send to
    the API. Receipts are read-only from the client's perspective, so
    this method is provided only for BaseAssembler completeness and
    is not called by PaymentApi.
  */
  toResourceFromEntity(entity: Receipt): ReceiptResource {
    return {
      id:              entity.id,
      clientId:        entity.clientId,
      invoiceNumber:   entity.invoiceNumber,
      locationName:    entity.locationName,
      date:            entity.date,
      durationHours:   entity.durationHours,
      durationMinutes: entity.durationMinutes,
      paymentMethod:   entity.paymentMethod,
      bookingCode:     entity.bookingCode,
      amount:          entity.amount,
      status:          entity.status,
    } as ReceiptResource;
  }

  /*
    Converts a wrapped API response into an array of entities.
    Used only if the API ever wraps the array in a container object.
    JSON Server returns a plain array today, so the endpoint calls
    toEntityFromResource() directly in that case.
  */
  toEntitiesFromResponse(response: ReceiptResponse): Receipt[] {
    return response.receipts.map((r) => this.toEntityFromResource(r));
  }
}
