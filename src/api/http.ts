/**
 * Cliente Axios del cliente Frontend — src/api/http.ts (AGENTS.md §4.2, DERCAS §7.2).
 *
 * - BaseURL de VITE_API_URL (nunca hardcodeada en el código).
 * - Token de acceso SOLO en memoria; token de refresco en sessionStorage.
 * - Intercepters: adjunta el token y, al recibir 401, refresca una vez y reintenta.
 * - Refresco rotativo: al rotar, el refresco anterior se invalida (Backend).
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { registrarActividad } from "../auth/actividad";

export const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface TokensApi {
  access: string;
  refresh: string;
}
let refrescoEnCurso: Promise<TokensApi> | null = null;

/** Token de acceso en memoria (nunca en localStorage). */
let tokenAcceso: string | null = null;
/** Refresco en sessionStorage — muere al cerrar la pestaña. */
const CLAVE_REFRESH = "fc_refresh_token";

export function obtenerTokenAcceso(): string | null {
  return tokenAcceso;
}

export function guardarTokenAcceso(token: string): void {
  tokenAcceso = token;
}

export function obtenerTokenRefresh(): string | null {
  try {
    return window.sessionStorage.getItem(CLAVE_REFRESH);
  } catch {
    return null;
  }
}

export function guardarTokenRefresh(token: string): void {
  try {
    window.sessionStorage.setItem(CLAVE_REFRESH, token);
  } catch {
    /* sessionStorage no disponible */
  }
}

export function eliminarTokens(): void {
  tokenAcceso = null;
  try {
    window.sessionStorage.removeItem(CLAVE_REFRESH);
  } catch {
    /* sessionStorage no disponible */
  }
}

export function sesionActiva(): boolean {
  return Boolean(tokenAcceso && obtenerTokenRefresh());
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

function adjuntarToken(config: InternalAxiosRequestConfig): void {
  const token = obtenerTokenAcceso();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
}

/** Refresca el token rotando el refresco en la API (contrato DERCAS §7.2). */
export async function refrescarToken(): Promise<TokensApi> {
  if (refrescoEnCurso) return refrescoEnCurso;
  const refresh = obtenerTokenRefresh();
  if (!refresh) throw new Error("Sin token de refresco activo");
  refrescoEnCurso = api
    .post<TokensApi>("/auth/refresh/", { refresh })
    .then((resp: AxiosResponse<TokensApi>) => {
      guardarTokenAcceso(resp.data.access);
      guardarTokenRefresh(resp.data.refresh);
      return resp.data;
    });
  try {
    return await refrescoEnCurso;
  } finally {
    refrescoEnCurso = null;
  }
}

api.interceptors.request.use((config) => {
  adjuntarToken(config);
  registrarActividad();
  return config;
});

api.interceptors.response.use(
  (response) => {
    registrarActividad();
    return response;
  },
  async (error: AxiosError<unknown>) => {
    registrarActividad();
    const original = error.config as
      (InternalAxiosRequestConfig & { _reintento?: boolean }) | undefined;
    if (
      error.response?.status === 401 &&
      original &&
      !original._reintento &&
      !original.url?.includes("/auth/login/") &&
      !original.url?.includes("/auth/google/") &&
      !original.url?.includes("/auth/refresh/")
    ) {
      try {
        await refrescarToken();
        adjuntarToken(original);
        original._reintento = true;
        return await api.request<unknown>(original);
      } catch {
        /* sin refresco válido: se invalida la sesión */
      }
    }
    throw error;
  },
);
