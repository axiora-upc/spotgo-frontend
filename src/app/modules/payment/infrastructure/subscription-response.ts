/*
  SubscriptionResource is the shape of one item as the API serializes it.
  We keep it separate from the Subscription entity so that backend changes
  (renames, type widening, etc.) only affect this file and the
  assembler that translates between them.

  SubscriptionResponse is reserved for the case where the API wraps the
  array in a container (e.g. { content: [...] }). JSON Server today
  returns a plain array so this interface is unused, but we keep it to
  fit the BaseApiEndpoint contract.
*/
import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

/**
 * Describe de object returned by the API 
 * for a subscription. 
 * This is the raw data
 */
export interface SubscriptionResource extends BaseResource {
  id: string;
  clientId: string;
  planId: string;
  status: string;
  renewsOn: string;
  pricePerMonth: number;
  sessions: number;
  savedThisMonth: number;
  savingsMonth?: string;
  memberSince: string;
  autoRenewal: boolean;
  paymentMethodLastFour: string;
  paymentMethodExpiry: string;
}
/**
 * In case raw data come in an array
 */
export interface SubscriptionResponse extends BaseResponse {
  subscriptions: SubscriptionResource[];
}
