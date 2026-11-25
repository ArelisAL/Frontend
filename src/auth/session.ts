/**
 * Cierre de sesión por inactividad (AGENTS.md §10.3).
 * Cada 30 min sin uso (check cada 30 s) se llama cerrarSesion()
 * de api/auth, que invalida el refresco en la API y borra los tokens.
 */

import { obtenerUltimaActividad } from "./actividad";
import { cerrarSesion } from "../api/auth";

const INACTIVIDAD_MS = 30 * 60 * 1000;
const CHECK_MS = 30_000;

let temporizador: ReturnType<typeof setInterval> | null = null;

export function iniciarRastreoInactividad(alExpirar?: () => void): void {
  if (temporizador) return;
  temporizador = setInterval(() => {
    if (Date.now() - obtenerUltimaActividad() >= INACTIVIDAD_MS) {
      detenerRastreoInactividad();
      // Primero se desmontan las rutas privadas para no dejar datos visibles
      // mientras la API invalida el refresh en segundo plano.
      alExpirar?.();
      void cerrarSesion();
    }
  }, CHECK_MS);
}

export function detenerRastreoInactividad(): void {
  if (temporizador) {
    clearInterval(temporizador);
    temporizador = null;
  }
}

export function verificarInactividadAhora(): boolean {
  return Date.now() - obtenerUltimaActividad() >= INACTIVIDAD_MS;
}
