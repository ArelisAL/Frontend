/**
 * Módulo de autenticación del cliente Frontend — src/api/auth.ts (4.1).
 * Funciones: login, refresh, yo (obtenerUsuarioActual), cambiar contraseña,
 * cerrar sesión (invalida el refresco en la API y borra tokens).
 * Contracto DERCAS §7.2: rutas /api/v1/auth/*, errores {"error", "detalle"}.
 */

import {
  api,
  eliminarTokens,
  guardarTokenAcceso,
  guardarTokenRefresh,
  obtenerTokenRefresh,
  refrescarToken,
} from "./http";

export interface Tokens {
  access: string;
  refresh: string;
}

/** Campos devueltos por GET /api/v1/auth/yo/ (UsuarioSerializer). */
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  debe_cambiar_contraseña: boolean;
}

/** Credenciales POST /api/v1/auth/login/. */
export interface CredencialesLogin {
  email: string;
  password: string;
}

/** POST /api/v1/auth/login/ — el token de acceso queda solo en memoria. */
export async function login(credenciales: CredencialesLogin): Promise<Tokens> {
  const { data } = await api.post<Tokens>("/auth/login/", credenciales);
  guardarTokenAcceso(data.access);
  guardarTokenRefresh(data.refresh);
  return data;
}

/** POST /api/v1/auth/google/ — el Backend valida el ID token de Google. */
export async function loginConGoogle(credential: string): Promise<Tokens> {
  const { data } = await api.post<Tokens>("/auth/google/", { credential });
  guardarTokenAcceso(data.access);
  guardarTokenRefresh(data.refresh);
  return data;
}

/** POST /api/v1/auth/refresh/ — rota el refresco (Backend) y actualiza tokens. */
export async function refrescarSesion(): Promise<Tokens> {
  const { data } = await api.post<Tokens>("/auth/refresh/", {
    refresh: obtenerTokenRefresh(),
  });
  guardarTokenAcceso(data.access);
  guardarTokenRefresh(data.refresh);
  return data;
}

/** GET /api/v1/auth/yo/ — datos del usuario autenticado. */
export async function obtenerUsuarioActual(): Promise<Usuario> {
  const { data } = await api.get<Usuario>("/auth/yo/");
  return data;
}

/** POST /api/v1/auth/cambiar-contrasena/ — {nueva_contrasena} (cambio temporal). */
export async function cambiarContrasena(
  contrasenaActual: string,
  nuevaContrasena: string,
): Promise<void> {
  const { data } = await api.post<Tokens>("/auth/cambiar-contrasena/", {
    contrasena_actual: contrasenaActual,
    nueva_contrasena: nuevaContrasena,
  });
  guardarTokenAcceso(data.access);
  guardarTokenRefresh(data.refresh);
}

/** POST /api/v1/auth/logout/ — invalida el refresco en la API, borra los tokens. */
export async function cerrarSesion(): Promise<void> {
  const refresh = obtenerTokenRefresh();
  // Despeja de inmediato la sesión local. El logout remoto puede quedar en
  // vuelo mientras se inicia otra sesión; no debe borrar los tokens nuevos.
  eliminarTokens();
  if (refresh) {
    try {
      await api.post("/auth/logout/", { refresh });
    } catch {
      /* el refresco ya vencido no bloquea la limpieza local */
    }
  }
}

// Refresh sin depender de interceptor: refuerza el path del retry (http.ts).
export { refrescarToken };
