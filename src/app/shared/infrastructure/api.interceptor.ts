import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, timeout } from 'rxjs/operators';
import { catchError } from 'rxjs';

const MOCK_FALLBACK_HEADER = 'X-Mock-Fallback';

const BACKEND_RESOURCES = [
  'parkings', 'reservations', 'subscriptions',
  'receipts', 'clientPlans', 'blueprints', 'detectedSpots',
  'clientReports', 'employees', 'occupancyByHour', 'weeklyTrends',
];

/*
  QUE ES ESTE MAPA:
  El backend real guarda los ids como numeros planos (1, 2, 3...), pero el
  mock (db.json) y el resto del frontend esperan ids con prefijo de texto
  ("usr-001", "prk-002", etc). Este mapa le dice al interceptor, PARA CADA
  CAMPO DE CADA RECURSO, que prefijo ponerle cuando la respuesta viene del
  backend real (ver translateResponse mas abajo) y que prefijo sacarle
  cuando el body sale hacia el backend real (ver buildBackendRequest).

  COMO SE LEE CADA VALOR:
    'usr'  -> ese campo se convierte a "usr-003" (string con prefijo)
    ''     -> ese campo se deja como numero plano en texto: "3"

  COMO SE DECIDE SI UN CAMPO LLEVA PREFIJO O NO (esto es la parte clave):
  No es arbitrario. La regla es: si en algun lado del frontend ese campo
  se COMPARA por igualdad de string contra el "id" de otra entidad
  (ej: `parkings.find(p => p.id === reservation.parkingId)`), entonces
  ambos lados de esa comparacion TIENEN que llevar el mismo prefijo,
  sino la comparacion nunca da true.

  Por eso:
  - parkings.id usa 'prk' porque blueprints.parkingId, reservations.parkingId
    y detectedSpots.parkingId TAMBIEN usan 'prk' -> se pueden comparar entre si.

*/
const ID_PREFIX_MAP: Record<string, Record<string, string>> = {
  parkings:      { id: 'prk', adminId: 'usr' },
  blueprints:    { id: 'blp', adminId: 'usr', parkingId: 'prk' },
  detectedSpots: { id: '', blueprintId: 'blp', parkingId: 'prk' },
  reservations:  { id: '', clientId: 'usr', parkingId: 'prk' },
  subscriptions: { id: '', clientId: 'usr', planId: 'pln' },
  receipts:      { id: '', clientId: 'usr' },
  clientPlans:   { id: 'pln' },
  clientReports: {
    id: '',            // el id propio del reporte no se compara contra nada -> sin prefijo
    clientId: 'usr',   // se compara contra users.id, que usa 'usr' -> mismo prefijo
    parkingId: 'prk',  // se compara contra parkings.id, que usa 'prk' -> mismo prefijo
    reservationId: '', // se compara contra reservations.id, que usa '' -> mismo (sin prefijo)
  },
  employees:       { id: '', parkingId: 'prk' },
  occupancyByHour: { id: '', parkingId: 'prk' },
  weeklyTrends:    { id: '', parkingId: 'prk' },
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
