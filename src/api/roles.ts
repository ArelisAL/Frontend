/**
 * Roles del taller (usuarios/models.py del Backend — glosario DERCAS §1.5).
 */

export const ROLES = ["administradora", "recepcionista", "costurera"] as const;
export type Rol = (typeof ROLES)[number];

export const ROL_ADMINISTRADORA: Rol = "administradora";
export const ROL_RECEPCIONISTA: Rol = "recepcionista";
export const ROL_COSTURA: Rol = "costurera";

export function esAdministradora(rol: string | undefined): boolean {
  return rol === ROL_ADMINISTRADORA;
}

export function rolPermitidoEnFrontend(rol: string | undefined): boolean {
  return (
    rol === ROL_ADMINISTRADORA ||
    rol === ROL_RECEPCIONISTA ||
    rol === ROL_COSTURA
  );
}
