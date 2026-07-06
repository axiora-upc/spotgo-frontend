# SpotGo Frontend

Frontend de SpotGo en Angular. Consume directamente el backend Spring Boot con JWT y usa rutas planas para clientes, admins y auth.

## Stack

- Angular 21 (standalone components, signals)
- Angular Material
- RxJS
- ngx-translate (ES/EN)

## Estructura

```
src/app/
  modules/
    monitoring/   dashboard, mapa en tiempo real, analytics
    parking/      reservas, historial
    payment/      suscripciones, recibos
    profiles/     croquis (blueprints), configuración, favoritos
  shared/         servicios, interceptores y componentes comunes
```

Cada módulo se carga con lazy loading desde `app.routes.ts`.

## Auth Y API

- La app consume un solo backend: `spotgo-backend`.
- El login usa `email + password`.
- El token JWT se guarda en `sessionStorage` como `spotgo:accessToken`.
- El interceptor agrega `Authorization: Bearer <token>` a las requests.
- `backend` ya no forma parte del flujo.

## Rutas Principales

- Auth público:
  - `/sign-in`
  - `/sign-up`
  - `/forgot-password`
- Client:
  - `/dashboard`
  - `/reservations`
  - `/subscriptions`
  - `/receipts`
  - `/favorites`
  - `/history`
- Admin:
  - `/realtime-map/overview`
  - `/realtime-map/reports`
  - `/realtime-map/employees`
  - `/analytics`
  - `/settings`

## Correr el proyecto

```bash
npm install
npm run build
ng serve
```

En desarrollo, `src/environments/environment.development.ts` apunta a `http://localhost:8080/api/v1`.

Para probar login seed, usa una cuenta del `db.json` del backend con password `Password123!`.


## Deploy

Desplegado en Vercel (`vercel.json`). El frontend se sirve como sitio estático y depende del backend desplegado para los datos y la autenticación.
