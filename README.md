# SpotGo Frontend

Frontend de SpotGo, hecho en Angular. Permite monitorear parqueos en tiempo real, gestionar reservas, pagos y perfiles.

## Stack

- Angular 21 (standalone components, signals)
- Angular Material
- RxJS
- ngx-translate (ES/EN)
- json-server (mock/respaldo de API)

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

## Backends

La app habla con dos backends:

- **Backend real** (Spring Boot + PostgreSQL, desplegado en Railway) — fuente de verdad.
- **json-server** (`server/db.json`) — respaldo para cuando el backend real no responde, y para desarrollo sin tener el backend corriendo.

El interceptor en `src/app/shared/infrastructure/api.interceptor.ts` decide a cuál de los dos mandar cada request. Si el backend real no responde en 1.5s, usa el respaldo.

## Correr el proyecto

```bash
npm install
ng start
```

Para correr el mock de API:

```bash
npm run server      # json-server en server/db.json
```

`src/environments/environment.development.ts` apunta a `localhost:8080` (backend real) y `localhost:3000` (json-server) en desarrollo.


## Deploy

Desplegado en Vercel (`vercel.json`). El build de Angular se sirve como sitio estático, y `index.js` corre como función serverless para el respaldo de json-server bajo `/api`.
