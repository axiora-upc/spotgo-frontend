/*
  Transport DTOs for the /clientPlans endpoint.

  ClientPlanResource is the shape of one item as the API serializes it.
  We keep it separate from the ClientPlan entity so that backend changes
  only affect this file and the assembler that translates between them.

  ClientPlanResponse is reserved for the case where the API wraps the
  array in a container (e.g. { content: [...] }). JSON Server today
  returns a plain array so this interface is unused, but we keep it to
  fit the BaseApiEndpoint contract.
*/
import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/*
  ClientPlanResource describes exactly one object as the API returns it.
  All fields are plain types (string, number) — no domain types here.
  The assembler is responsible for converting them to domain types.
*/
export interface ClientPlanResource extends BaseResource {
  id: string;
  type: string;
  name: string;
  monthlyPrice: number;
  description: string;
  reservationsPerMonth: number | null;
  features: string[];
}

/*
  ClientPlanResponse is used only if the API wraps the array in an object.
  JSON Server returns a plain array today, so this is unused for now.
*/
export interface ClientPlanResponse extends BaseResponse {
  clientPlans: ClientPlanResource[];
}
