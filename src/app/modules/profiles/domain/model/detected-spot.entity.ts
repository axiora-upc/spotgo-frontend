/*
  DetectedSpot es la entidad de dominio que representa un espacio de
  estacionamiento detectado automáticamente al analizar un croquis/blueprint.

  Se usa como interface (no clase) porque es un objeto de solo datos —
  no tiene comportamiento propio ni necesita instanciarse con new.

  x_pct, y_pct, w_pct, h_pct guardan la posición como porcentaje del
  tamaño total de la imagen. Así la información es válida sin importar
  la resolución o el tamaño de pantalla donde se muestre el croquis.

  row y col identifican la posición relativa del spot dentro de la
  grilla detectada. MonitoringStore los usa para agrupar los spots en
  filas (ParkingRow) y construir el ParkingSnapshot que muestra Overview.
*/
export interface DetectedSpot {
  id:      string;   // UUID persistido en backend
  code?:   number;   // codigo visible del spot en frontend
  row:     number;   // fila en la que fue detectado (0, 1, 2...)
  col:     number;   // columna dentro de la fila (0, 1, 2...)
  x_pct:  number;   // posición X como % del ancho total de la imagen
  y_pct:  number;   // posición Y como % del alto total de la imagen
  w_pct:  number;   // ancho del spot como % del ancho total de la imagen
  h_pct:  number;   // alto del spot como % del alto total de la imagen
  // Estado del spot: se actualiza en db.json cuando se reserva.
  // undefined equivale a 'available' (compatibilidad con registros anteriores).
  status?: 'available' | 'occupied' | 'maintenance';
}
