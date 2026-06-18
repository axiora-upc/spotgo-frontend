import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const backendUrl = (environment as any).backendUrl;

  if (!backendUrl) {
    return next(req);
  }

  const url = req.url;

  // 1. Intercept /api/parkings
  if (url.includes('/api/parkings') || url.includes('/parkings')) {
    // If it's a PATCH or PUT to /api/parkings/:id
    // e.g. /api/parkings/prk-001 or /api/parkings/1
    const match = url.match(/\/parkings\/([^\/]+)$/);
    if (match) {
      const id = match[1];
      const numericId = id.startsWith('prk-') ? parseInt(id.replace('prk-', ''), 10) : id;
      const targetUrl = `${backendUrl}/parkings/${numericId}`;

      let newReq = req.clone({ url: targetUrl });

      return next(newReq).pipe(
        map(event => {
          if (event instanceof HttpResponse) {
            return translateParkingResponse(event);
          }
          return event;
        })
      );
    } else {
      // It's a GET or POST to /api/parkings
      const targetUrl = `${backendUrl}/parkings`;
      let newReq = req.clone({ url: targetUrl });
      return next(newReq).pipe(
        map(event => {
          if (event instanceof HttpResponse) {
            return translateParkingResponse(event);
          }
          return event;
        })
      );
    }
  }

  // 2. Intercept /api/reservations
  if (url.includes('/api/reservations') || url.includes('/reservations')) {
    // Check if it is a spot-specific lookup or GET/POST to root
    const spotMatch = url.match(/\/reservations\/spot\/([^\/]+)$/);
    if (spotMatch) {
      // E.g. GET /api/reservations/spot/1
      const spotId = spotMatch[1];
      const targetUrl = `${backendUrl}/reservations/spot/${spotId}`;
      let newReq = req.clone({ url: targetUrl });
      return next(newReq).pipe(
        map(event => {
          if (event instanceof HttpResponse) {
            return translateReservationsResponse(event);
          }
          return event;
        })
      );
    }

    // Default root url /api/reservations
    const targetUrl = `${backendUrl}/reservations`;
    let body: any = req.body;

    // Translate outgoing request body if it is a POST
    if (req.method === 'POST' && body) {
      // Map spot string (e.g. "A2", "B5") and parkingId to numeric spotId
      let spotId = 1;
      const parkingIdStr = body.parkingId || 'prk-001';
      const numericParkingId = parseInt(parkingIdStr.replace('prk-', ''), 10) || 1;

      if (body.spot && typeof body.spot === 'string') {
        const charCode = body.spot.charCodeAt(0) - 65; // 'A' -> 0, 'B' -> 1
        const num = parseInt(body.spot.substring(1), 10) || 1;
        spotId = (numericParkingId - 1) * 100 + (charCode * 10) + num;
      }

      // Convert dates to LocalDateTime string (YYYY-MM-DDTHH:mm:ss)
      const startTime = body.startDate ? new Date(body.startDate).toISOString().split('.')[0] : new Date().toISOString().split('.')[0];
      const endTime = body.endDate ? new Date(body.endDate).toISOString().split('.')[0] : new Date().toISOString().split('.')[0];

      body = {
        vehiclePlate: body.code || 'UNKNOWN',
        spotId: spotId,
        startTime: startTime,
        endTime: endTime
      };
    }

    let newReq = req.clone({
      url: targetUrl,
      body: body
    });

    return next(newReq).pipe(
      map(event => {
        if (event instanceof HttpResponse) {
          return translateReservationsResponse(event);
        }
        return event;
      })
    );
  }

  return next(req);
};

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
