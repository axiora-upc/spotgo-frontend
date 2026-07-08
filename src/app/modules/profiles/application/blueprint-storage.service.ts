/*
  Injectable e inject son los bloques básicos de Angular moderno.
  signal es la función que crea variables reactivas.
*/
import { Injectable, inject, signal } from '@angular/core';
import { Blueprint } from '../domain/model/blueprint.entity';
import { DetectedSpot } from '../domain/model/detected-spot.entity';
import { BlueprintsApi } from '../infrastructure/blueprints-api';
import { CurrentUserService } from '../../../shared/services/current-user.service';

/*
  BlueprintInput son los datos que entrega el dialog de subida:
  el nombre elegido, la imagen en base64 y los spots detectados.
*/
export interface BlueprintInput {
  name: string;
  dataUrl: string;
  spots?: DetectedSpot[];
}

/*
  BlueprintStorageService gestiona los croquis del admin autenticado
  a través de la API (backend API, colección "blueprints").

  providedIn: 'root' significa que Angular crea una única instancia de este
  servicio para toda la aplicación (singleton).
  Esto garantiza que todos los componentes que lo inyecten vean la misma lista.
*/
@Injectable({ providedIn: 'root' })
export class BlueprintStorageService {

  private readonly api         = inject(BlueprintsApi);
  private readonly currentUser = inject(CurrentUserService);

  /*
    blueprints es el signal que contiene los croquis del admin actual.
    Empieza vacío hasta que load() resuelve la petición HTTP.
  */
  private readonly blueprintsSignal = signal<Blueprint[]>([]);
  readonly blueprints = this.blueprintsSignal.asReadonly();

  // ─── Lectura ──────────────────────────────────────────────────────────────

  /*
    load obtiene los croquis del admin autenticado desde la API y
    actualiza el signal. callbacks.onSuccess recibe la lista cargada,
    útil para componentes que necesitan reaccionar apenas llega (Overview).
  */
  load(callbacks?: { onSuccess?: (items: Blueprint[]) => void; onError?: () => void }): void {
    this.api.getBlueprints().subscribe({
      next: (all) => {
        const mine = all.filter((b) => b.adminId === this.currentUser.adminId);
        this.blueprintsSignal.set(mine);
        callbacks?.onSuccess?.(mine);
      },
      error: () => callbacks?.onError?.(),
    });
  }

  /*
    getNames devuelve solo los nombres de los croquis actuales.

    Es útil para validar si un nombre ya existe antes de subir
    un nuevo croquis, sin exponer los dataUrl (que son muy grandes).
  */
  getNames(): string[] {
    return this.blueprintsSignal().map((b) => b.name);
  }

  // ─── Escritura ────────────────────────────────────────────────────────────

  /*
    add envía un nuevo croquis a la API asociado al admin autenticado.

    Si la petición tiene éxito, el croquis devuelto (con su id asignado
    por la base de datos) se agrega al signal para que la lista se
    actualice sin necesidad de recargar.
  */
  add(item: BlueprintInput, callbacks?: { onSuccess?: () => void; onError?: (message: string) => void }): void {
    const blueprint = new Blueprint({
      id:        crypto.randomUUID(),
      adminId:   this.currentUser.adminId,
      parkingId: this.currentUser.parkingId,
      name:      item.name,
      dataUrl:   item.dataUrl,
      spots:     item.spots,
    });

    this.api.addBlueprint(blueprint).subscribe({
      next: (created) => {
        this.blueprintsSignal.update((current) => [...current, created]);
        callbacks?.onSuccess?.();

        /*
          Si la detección encontró spots, se actualizan totalSpaces,
          availableSpaces y totalFloors del parking principal para que
          coincidan con el croquis recién subido.
        */
        const total = created.spots.length;
        if (total > 0) {
          this.api.updateParkingStats(this.currentUser.parkingId, {
            totalSpaces:     total,
            availableSpaces: total,
            totalFloors:     1,
          }).subscribe({
            next: () => {},
            error: (err) => console.error('Failed to update parking stats after blueprint upload', err),
          });
        }
      },
      error: () => callbacks?.onError?.('settings.blueprint.error-storage'),
    });
  }

  /*
    remove elimina por nombre el croquis del admin autenticado.

    La comparación ignora mayúsculas/minúsculas para evitar
    que "Plano" y "plano" se consideren nombres diferentes.

    Si la petición tiene éxito, el croquis se quita del signal.
  */
  remove(name: string, callbacks?: { onSuccess?: () => void; onError?: () => void }): void {
    const target = this.blueprintsSignal().find(
      (b) => b.name.toLowerCase() === name.toLowerCase()
    );
    if (!target) {
      callbacks?.onError?.();
      return;
    }

    this.api.removeBlueprint(target.id).subscribe({
      next: () => {
        this.blueprintsSignal.update((current) => current.filter((b) => b.id !== target.id));
        callbacks?.onSuccess?.();
      },
      error: () => callbacks?.onError?.(),
    });
  }
}
