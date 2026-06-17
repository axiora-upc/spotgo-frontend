import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface BlueprintResource extends BaseResource {
  id: string;
  adminId: string;
  parkingId: string;
  name: string;
  dataUrl: string;
}

export interface DetectedSpotResource extends BaseResource {
  id:          string;
  localId:     number;
  blueprintId: string;
  parkingId:   string;
  row:         number;
  col:         number;
  x_pct:       number;
  y_pct:       number;
  w_pct:       number;
  h_pct:       number;
  status?:     string;
}

export interface BlueprintResponse extends BaseResponse {
  blueprints: BlueprintResource[];
}
