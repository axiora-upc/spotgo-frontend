import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs';

const MOCK_FALLBACK_HEADER = 'X-Mock-Fallback';

const BACKEND_RESOURCES = [
  'parkings', 'reservations', 'subscriptions',
  'receipts', 'clientPlans', 'blueprints', 'detectedSpots',
];

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.get(MOCK_FALLBACK_HEADER)) return next(req);

  const backendUrl = (environment as any).backendUrl;
  const apiUrl = (environment as any).apiUrl;

  if (!backendUrl || !apiUrl) return next(req);

  const resource = BACKEND_RESOURCES.find(r => {
    const pattern = new RegExp(`[/]${r}([/?]|$)`);
    return pattern.test(req.url);
  });
  if (!resource) return next(req);

  const backendReq = buildBackendRequest(req, backendUrl, apiUrl, resource);
  if (!backendReq) return next(req);

  return next(backendReq).pipe(
    map(event => {
      if (event instanceof HttpResponse) {
        return translateResponse(event, resource);
      }
      return event;
    }),
    catchError(() => {
      const fallbackReq = req.clone({
        setHeaders: { [MOCK_FALLBACK_HEADER]: 'true' },
      });
      return next(fallbackReq);
    })
  );
};

function buildBackendRequest(
  req: any,
  backendUrl: string,
  apiUrl: string,
  resource: string,
): any {
  const url = req.url;

  if (resource === 'parkings') return buildParkingRequest(req, backendUrl, url);
  if (resource === 'reservations') return buildReservationRequest(req, backendUrl, url);

  // Generic: replace apiUrl base with backendUrl, strip ID prefixes
  let newUrl = url.replace(apiUrl, backendUrl);
  newUrl = stripAllIdPrefixes(newUrl);

  return req.clone({ url: newUrl, body: req.body });
}

function stripAllIdPrefixes(url: string): string {
  // Strip xxx-NNN prefix in path segments: /prk-001 → /1
  url = url.replace(/\/[a-z]+-(\d+)/g, '/$1');
  // Strip xxx-NNN prefix in query values: =prk-001 → =1
  url = url.replace(/=([a-z]+-)(\d+)/g, '=$2');
  return url;
}

function buildParkingRequest(req: any, backendUrl: string, url: string): any {
  let newUrl = stripAllIdPrefixes(url.replace((environment as any).apiUrl, backendUrl));
  return req.clone({ url: newUrl, body: req.body });
}

function buildReservationRequest(req: any, backendUrl: string, url: string): any {
  let newUrl = stripAllIdPrefixes(url.replace((environment as any).apiUrl, backendUrl));
  let body: any = req.body;

  if (req.method === 'POST' && body) {
    let spotId = 1;
    const parkingIdStr = body.parkingId || 'prk-001';
    const numericParkingId = parseInt(parkingIdStr.replace(/^[a-z]+-/, ''), 10) || 1;

    if (body.spot && typeof body.spot === 'string') {
      const charCode = body.spot.charCodeAt(0) - 65;
      const num = parseInt(body.spot.substring(1), 10) || 1;
      spotId = (numericParkingId - 1) * 100 + (charCode * 10) + num;
    }

    const startTime = body.startDate
      ? new Date(body.startDate).toISOString().split('.')[0]
      : new Date().toISOString().split('.')[0];
    const endTime = body.endDate
      ? new Date(body.endDate).toISOString().split('.')[0]
      : new Date().toISOString().split('.')[0];

    body = { vehiclePlate: body.code || 'UNKNOWN', spotId, startTime, endTime };
  }

  return req.clone({ url: newUrl, body });
}

function translateResponse(event: HttpResponse<any>, resource: string): HttpResponse<any> {
  switch (resource) {
    case 'parkings': return translateParkingResponse(event);
    case 'reservations': return translateReservationsResponse(event);
    case 'blueprints': return translateBlueprintResponse(event);
    case 'detectedSpots': return translateDetectedSpotResponse(event);
    default: return event;
  }
}

function translateParkingResponse(event: HttpResponse<any>): HttpResponse<any> {
  const body = event.body;
  if (!body) return event;
  const t = (item: any) => ({
    id: `prk-${String(item.id).padStart(3, '0')}`,
    adminId: 'usr-001',
    name: item.name,
    address: item.location,
    city: 'Lima',
    totalSpaces: item.totalSpots || 28,
    availableSpaces: item.totalSpots || 28,
    totalFloors: 1,
    averageOccupancy: 80,
    peakHour: '12:00',
    totalRevenue: 1000,
    systemStatus: 'active',
    rating: item.rating ?? 4,
    pricePerHour: item.pricePerHour ?? 3,
  });
  return event.clone({ body: Array.isArray(body) ? body.map(t) : t(body) });
}

function translateReservationsResponse(event: HttpResponse<any>): HttpResponse<any> {
  const body = event.body;
  if (!body) return event;
  const t = (item: any) => {
    const pNum = Math.floor((item.spotId - 1) / 100) + 1;
    const local = ((item.spotId - 1) % 100) + 1;
    const cc = Math.floor((local - 1) / 10);
    const n = ((local - 1) % 10) + 1;
    return {
      id: String(item.id),
      clientId: 'usr-003',
      parkingId: `prk-${String(pNum).padStart(3, '0')}`,
      code: item.vehiclePlate,
      spot: String.fromCharCode(65 + cc) + n,
      startDate: item.startTime,
      endDate: item.endTime,
      status: (item.status || 'ACTIVE').toLowerCase(),
      amount: 0.05,
      baseAmount: 0.05,
      rating: null,
    };
  };
  return event.clone({ body: Array.isArray(body) ? body.map(t) : t(body) });
}

function translateBlueprintResponse(event: HttpResponse<any>): HttpResponse<any> {
  const body = event.body;
  if (!body) return event;
  const t = (item: any) => ({
    id: `blp-${String(item.id).padStart(3, '0')}`,
    adminId: 'usr-001',
    parkingId: item.parkingId,
    name: `Blueprint ${item.id}`,
    dataUrl: item.imageUrl || '',
  });
  return event.clone({ body: Array.isArray(body) ? body.map(t) : t(body) });
}

function translateDetectedSpotResponse(event: HttpResponse<any>): HttpResponse<any> {
  const body = event.body;
  if (!body) return event;
  const t = (item: any) => ({
    id: item.id,
    localId: item.id,
    blueprintId: item.blueprintId,
    parkingId: String(item.blueprintId || ''),
    row: 0, col: 0,
    x_pct: item.x || 0,
    y_pct: item.y || 0,
    w_pct: 10, h_pct: 10,
    status: (item.status || 'available').toLowerCase(),
  });
  return event.clone({ body: Array.isArray(body) ? body.map(t) : t(body) });
}
