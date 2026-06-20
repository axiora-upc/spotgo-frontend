import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, timeout } from 'rxjs/operators';
import { catchError } from 'rxjs';

const MOCK_FALLBACK_HEADER = 'X-Mock-Fallback';

const BACKEND_RESOURCES = [
  'parkings', 'reservations', 'subscriptions',
  'receipts', 'clientPlans', 'blueprints', 'detectedSpots',
];

const ID_PREFIX_MAP: Record<string, Record<string, string>> = {
  parkings:      { id: 'prk', adminId: 'usr' },
  blueprints:    { id: 'blp', adminId: 'usr', parkingId: 'prk' },
  detectedSpots: { id: '', blueprintId: 'blp', parkingId: 'prk' },
  reservations:  { id: '', clientId: 'usr', parkingId: 'prk' },
  subscriptions: { id: '', clientId: 'usr', planId: 'pln' },
  receipts:      { id: '', clientId: 'usr' },
  clientPlans:   { id: 'pln' },
};

const BACKEND_TIMEOUT_MS = 1500;
const BACKEND_COOLDOWN_MS = 15000;

let backendDownUntil = 0;

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

  if (Date.now() < backendDownUntil) {
    const fallbackReq = req.clone({ setHeaders: { [MOCK_FALLBACK_HEADER]: 'true' } });
    return next(fallbackReq);
  }

  const backendReq = buildBackendRequest(req, backendUrl, apiUrl, resource);
  if (!backendReq) return next(req);

  return next(backendReq).pipe(
    timeout(BACKEND_TIMEOUT_MS),
    map(event => {
      if (event instanceof HttpResponse) {
        return translateResponse(event, resource);
      }
      return event;
    }),
    catchError(() => {
      backendDownUntil = Date.now() + BACKEND_COOLDOWN_MS;
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
  let newUrl = stripAllIdPrefixes(url.replace(apiUrl, backendUrl));
  let body: any = req.body;

  if (body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const fieldMap = ID_PREFIX_MAP[resource];
    if (fieldMap) {
      const newBody: any = {};
      for (const [key, value] of Object.entries(body)) {
        if (key in fieldMap && typeof value === 'string') {
          newBody[key] = parseInt(value.replace(/^[a-z]+-/, ''), 10);
        } else {
          newBody[key] = value;
        }
      }
      body = newBody;
    }
  }

  return req.clone({ url: newUrl, body });
}

function stripAllIdPrefixes(url: string): string {
  url = url.replace(/\/[a-z]+-(\d+)/g, '/$1');
  url = url.replace(/=([a-z]+-)(\d+)/g, '=$2');
  return url;
}

function translateResponse(event: HttpResponse<any>, resource: string): HttpResponse<any> {
  const body = event.body;
  if (!body) return event;
  const fieldMap = ID_PREFIX_MAP[resource];
  if (!fieldMap) return event;

  const t = (item: any) => {
    const result: any = { ...item };
    for (const [field, prefix] of Object.entries(fieldMap)) {
      const val = item[field];
      if (val != null) {
        result[field] = prefix ? `${prefix}-${String(val).padStart(3, '0')}` : String(val);
      }
    }
    return result;
  };
  return event.clone({ body: Array.isArray(body) ? body.map(t) : t(body) });
}
