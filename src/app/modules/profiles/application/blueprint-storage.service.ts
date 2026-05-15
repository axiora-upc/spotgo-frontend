/*
  Injectable es el decorador que marca esta clase como un servicio
  que puede ser inyectado en otros componentes.

  signal es la función que crea variables reactivas.
*/
import { Injectable, signal } from '@angular/core';

/*
  BlueprintItem es la interfaz que representa un croquis guardado.

  name    - nombre único que el admin asignó al croquis.
  dataUrl - la imagen codificada en base64 (formato data:image/...;base64,...).
            Permite mostrar la imagen directamente en el browser sin servidor.
*/
export interface BlueprintItem {
  name: string;
  dataUrl: string;
}

/*
  STORAGE_KEY es la clave que se usa en localStorage para guardar
  y recuperar la lista de croquis.

  Usar una constante evita errores de tipeo si se usa en varios lugares.
*/
const STORAGE_KEY = 'spotgo_blueprints';

/*
  BlueprintStorageService gestiona el almacenamiento de croquis en localStorage.

  providedIn: 'root' significa que Angular crea una única instancia de este
  servicio para toda la aplicación (singleton).
  Esto garantiza que todos los componentes que lo inyecten vean la misma lista.
*/
@Injectable({ providedIn: 'root' })
export class BlueprintStorageService {

  /*
    blueprints es el signal que contiene la lista actual de croquis.

    Se inicializa leyendo localStorage al arrancar el servicio,
    por lo que los croquis persisten entre recargas de página.
    Si no hay nada guardado, se inicializa con un arreglo vacío.
  */
  blueprints = signal<BlueprintItem[]>(this.loadFromStorage());

  // ─── Lectura ──────────────────────────────────────────────────────────────

  /*
    loadFromStorage lee la lista de croquis desde localStorage.

    JSON.parse convierte el string guardado de vuelta a un arreglo de objetos.
    Si la clave no existe o hay un error de parseo, devuelve un arreglo vacío
    para evitar que la aplicación falle.
  */
  private loadFromStorage(): BlueprintItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as BlueprintItem[]) : [];
    } catch {
      return [];
    }
  }

  // ─── Escritura ────────────────────────────────────────────────────────────

  /*
    saveToStorage guarda la lista actual del signal en localStorage.

    JSON.stringify convierte el arreglo de objetos a un string
    para que pueda ser guardado en localStorage.
    Se llama internamente después de cada operación de agregar o borrar.
  */
  private saveToStorage(items: BlueprintItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  // ─── Operaciones públicas ─────────────────────────────────────────────────

  /*
    getNames devuelve solo los nombres de los croquis actuales.

    Es útil para validar si un nombre ya existe antes de subir
    un nuevo croquis, sin exponer los dataUrl (que son muy grandes).
  */
  getNames(): string[] {
    return this.blueprints().map((b) => b.name);
  }

  /*
    add agrega un nuevo croquis a la lista.

    1. Lee la lista actual del signal.
    2. Agrega el nuevo item al final.
    3. Actualiza el signal con la nueva lista (dispara re-render).
    4. Persiste la nueva lista en localStorage.
  */
  add(item: BlueprintItem): string | null {
    const updated = [...this.blueprints(), item];
    try {
      this.saveToStorage(updated);
    } catch {
      return 'settings.blueprint.error-storage';
    }
    this.blueprints.set(updated);
    return null;
  }

  /*
    remove elimina un croquis por su nombre.

    La comparación ignora mayúsculas/minúsculas para evitar
    que "Plano" y "plano" se consideren nombres diferentes.

    1. Filtra la lista actual excluyendo el item con ese nombre.
    2. Actualiza el signal con la lista filtrada.
    3. Persiste la lista actualizada en localStorage.

    Devuelve true si encontró y eliminó el item, false si no existía.
  */
  remove(name: string): boolean {
    const current = this.blueprints();
    const filtered = current.filter(
      (b) => b.name.toLowerCase() !== name.toLowerCase()
    );

    /*
      Si la longitud no cambió, significa que no existía ningún item
      con ese nombre, por lo que se devuelve false.
    */
    if (filtered.length === current.length) return false;

    this.blueprints.set(filtered);
    this.saveToStorage(filtered);
    return true;
  }
}
