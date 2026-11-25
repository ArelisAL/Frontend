/**
 * Marca de actividad última (sin dependencias — se importa desde api/http y
 * auth/session sin crear ciclos).
 */

let ultimaActividad = Date.now();

export function registrarActividad(): void {
  ultimaActividad = Date.now();
}

export function obtenerUltimaActividad(): number {
  return ultimaActividad;
}
