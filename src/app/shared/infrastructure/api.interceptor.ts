import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs';

const MOCK_FALLBACK_HEADER = 'X-Mock-Fallback';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.get(MOCK_FALLBACK_HEADER)) {
    return next(req);
  }

  const backendUrl = (environment as any).backendUrl;

  if (!backendUrl) {
    return next(req);
  }

  const url = req.url;
  const isParking = url.includes('/api/parkings') || url.includes('/parkings');
  const isReservation = url.includes('/api/reservations') || url.includes('/reservations');

  if (!isParking && !isReservation) {
    return next(req);
  }

  const backendReq = buildBackendRequest(req, backendUrl, isParking, isReservation);

  return next(backendReq).pipe(
    map(event => {
      if (event instanceof HttpResponse) {
        return isParking
          ? translateParkingResponse(event)
          : translateReservationsResponse(event);
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
  isParking: boolean,
  isReservation: boolean,
): any {
  const url = req.url;

  if (isParking) {
    const match = url.match(/\/parkings\/([^\/]+)$/);
    if (match) {
      const id = match[1];
      const numericId = id.startsWith('prk-') ? parseInt(id.replace('prk-', ''), 10) : id;
      return req.clone({ url: `${backendUrl}/parkings/${numericId}` });
    }
    return req.clone({ url: `${backendUrl}/parkings` });
  }

  if (isReservation) {
    const spotMatch = url.match(/\/reservations\/spot\/([^\/]+)$/);
    if (spotMatch) {
      return req.clone({ url: `${backendUrl}/reservations/spot/${spotMatch[1]}` });
    }

    const targetUrl = `${backendUrl}/reservations`;
    let body: any = req.body;

    if (req.method === 'POST' && body) {
      let spotId = 1;
      const parkingIdStr = body.parkingId || 'prk-001';
      const numericParkingId = parseInt(parkingIdStr.replace('prk-', ''), 10) || 1;

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

      body = {
        vehiclePlate: body.code || 'UNKNOWN',
        spotId,
        startTime,
        endTime,
      };
    }

    return req.clone({ url: targetUrl, body });
  }

  return req;
}

// Helper function to translate backend parking response to frontend mock format
function translateParkingResponse(event: HttpResponse<any>): HttpResponse<any> {
  const body = event.body;
  if (!body) return event;

  const translateItem = (item: any) => {
    const padId = String(item.id).padStart(3, '0');
    return {
      id: `prk-${padId}`,
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
      pricePerHour: item.pricePerHour ?? 3
    };
  };

  let newBody;
  if (Array.isArray(body)) {
    newBody = body.map(translateItem);
  } else if (body && typeof body === 'object') {
    newBody = translateItem(body);
  }

  return event.clone({ body: newBody });
}

// Helper function to translate backend reservation response to frontend mock format
function translateReservationsResponse(event: HttpResponse<any>): HttpResponse<any> {
  const body = event.body;
  if (!body) return event;

  const translateItem = (item: any) => {
    // Reconstruct spot name and parking ID from spotId
    const parkingIdNum = Math.floor((item.spotId - 1) / 100) + 1;
    const parkingId = `prk-${String(parkingIdNum).padStart(3, '0')}`;

    const spotIdLocal = ((item.spotId - 1) % 100) + 1;
    const charCode = Math.floor((spotIdLocal - 1) / 10);
    const num = ((spotIdLocal - 1) % 10) + 1;
    const spotName = String.fromCharCode(65 + charCode) + num;

    return {
      id: String(item.id),
      clientId: 'usr-003',
      parkingId: parkingId,
      code: item.vehiclePlate,
      spot: spotName,
      startDate: item.startTime,
      endDate: item.endTime,
      status: (item.status || 'ACTIVE').toLowerCase(),
      amount: 0.05,
      baseAmount: 0.05,
      rating: null
    };
  };

  let newBody;
  if (Array.isArray(body)) {
    newBody = body.map(translateItem);
  } else if (body && typeof body === 'object') {
    newBody = translateItem(body);
  }

  return event.clone({ body: newBody });
}
