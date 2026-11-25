/**
 * Extracción de mensajes de error de la API (contrato DERCAS §7.2):
 * respuestas {"error": codigo, "detalle": mensaje}.
 */

import type { AxiosError } from "axios";

function _sinError(): string {
  return "No se pudo realizar la acción. Intenta de nuevo.";
}

export function extraerMensajeError(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const respuesta = (error as AxiosError).response;
    if (respuesta) {
      const datos = respuesta.data as
        { detalle?: string | string[]; error?: string } | undefined;
      if (datos) {
        if (typeof datos.detalle === "string" && datos.detalle)
          return datos.detalle;
        if (Array.isArray(datos.detalle)) {
          const partes = datos.detalle.filter((d): d is string => Boolean(d));
          if (partes.length > 0) return partes.join("; ");
        }
        if (typeof datos.error === "string" && datos.error) return datos.error;
      }
      const status = respuesta.status;
      if (status)
        return `Error ${status}: ${respuesta.statusText || _sinError()}`;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return _sinError();
}
