import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./http", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
  guardarTokenAcceso: vi.fn(),
  guardarTokenRefresh: vi.fn(),
  obtenerTokenRefresh: vi.fn(() => null),
  eliminarTokens: vi.fn(),
  sesionActiva: vi.fn(() => false),
  refrescarToken: vi.fn(),
}));

import {
  api,
  guardarTokenAcceso,
  guardarTokenRefresh,
  obtenerTokenRefresh,
  eliminarTokens,
} from "./http";
import {
  login,
  loginConGoogle,
  cambiarContrasena,
  cerrarSesion,
  obtenerUsuarioActual,
  refrescarSesion,
} from "./auth";

const apiPost = vi.mocked(api.post);
const apiGet = vi.mocked(api.get);

describe("auth (src/api/auth.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("login: POST /auth/login/ y guarda tokens en memoria + sessionStorage", async () => {
    apiPost.mockResolvedValueOnce({
      data: { access: "tok.acc", refresh: "tok.ref" },
    });
    const resultado = await login({
      email: "ana@fran.com",
      password: "contraseña123",
    });
    expect(apiPost).toHaveBeenCalledWith("/auth/login/", {
      email: "ana@fran.com",
      password: "contraseña123",
    });
    expect(resultado.access).toBe("tok.acc");
    expect(guardarTokenAcceso).toHaveBeenCalledWith("tok.acc");
    expect(guardarTokenRefresh).toHaveBeenCalledWith("tok.ref");
  });

  it("login: rechaza con el mensaje de la API", async () => {
    apiPost.mockRejectedValueOnce(new Error("rechazado"));
    await expect(login({ email: "a@b.c", password: "x" })).rejects.toThrow();
  });

  it("loginConGoogle: envía la credencial al Backend y guarda sus JWT", async () => {
    apiPost.mockResolvedValueOnce({
      data: { access: "google.access", refresh: "google.refresh" },
    });
    const resultado = await loginConGoogle("id-token-google");
    expect(apiPost).toHaveBeenCalledWith("/auth/google/", {
      credential: "id-token-google",
    });
    expect(resultado.access).toBe("google.access");
    expect(guardarTokenAcceso).toHaveBeenCalledWith("google.access");
    expect(guardarTokenRefresh).toHaveBeenCalledWith("google.refresh");
  });

  it("refrescarSesion: POST /auth/refresh/ rotando tokens", async () => {
    vi.mocked(obtenerTokenRefresh).mockReturnValueOnce("tok.ref.viejo");
    apiPost.mockResolvedValueOnce({
      data: { access: "tok.acc.nuevo", refresh: "tok.ref.nuevo" },
    });
    const resultado = await refrescarSesion();
    expect(apiPost).toHaveBeenCalledWith("/auth/refresh/", {
      refresh: "tok.ref.viejo",
    });
    expect(resultado.access).toBe("tok.acc.nuevo");
    expect(guardarTokenAcceso).toHaveBeenCalledWith("tok.acc.nuevo");
  });

  it("obtenerUsuarioActual: GET /auth/yo/ devuelve el usuario", async () => {
    const yo = {
      id: 1,
      nombre: "Ana",
      email: "ana@fran.com",
      rol: "costurera",
      activo: true,
      debe_cambiar_contraseña: false,
    };
    apiGet.mockResolvedValueOnce({ data: yo });
    await expect(obtenerUsuarioActual()).resolves.toEqual(yo);
    expect(apiGet).toHaveBeenCalledWith("/auth/yo/");
  });

  it("cambiarContrasena: POST /auth/cambiar-contrasena/ con nueva_contrasena", async () => {
    apiPost.mockResolvedValueOnce({ data: {} });
    await cambiarContrasena("temporal-segura", "nueva-contraseña-largo");
    expect(apiPost).toHaveBeenCalledWith("/auth/cambiar-contrasena/", {
      contrasena_actual: "temporal-segura",
      nueva_contrasena: "nueva-contraseña-largo",
    });
  });

  it("cerrarSesion: invalida refresco en API y borra tokens", async () => {
    vi.mocked(obtenerTokenRefresh).mockReturnValueOnce("tok.ref.actual");
    apiPost.mockResolvedValueOnce({ data: {} });
    await cerrarSesion();
    expect(apiPost).toHaveBeenCalledWith("/auth/logout/", {
      refresh: "tok.ref.actual",
    });
    expect(eliminarTokens).toHaveBeenCalled();
  });

  it("cerrarSesion: si no hay refresco, solo borra tokens", async () => {
    vi.mocked(obtenerTokenRefresh).mockReturnValueOnce(null);
    await cerrarSesion();
    expect(apiPost).not.toHaveBeenCalled();
    expect(eliminarTokens).toHaveBeenCalled();
  });

  it("cerrarSesion: no borra los tokens de una sesión nueva al terminar el logout anterior", async () => {
    vi.mocked(obtenerTokenRefresh).mockReturnValueOnce("tok.ref.anterior");
    let completarLogout: (() => void) | undefined;
    apiPost.mockReturnValueOnce(
      new Promise((resolve) => {
        completarLogout = () => resolve({ data: {} });
      }),
    );

    const logoutPendiente = cerrarSesion();
    expect(eliminarTokens).toHaveBeenCalledTimes(1);
    expect(apiPost).toHaveBeenCalledWith("/auth/logout/", {
      refresh: "tok.ref.anterior",
    });

    guardarTokenAcceso("tok.acc.nuevo");
    guardarTokenRefresh("tok.ref.nuevo");
    completarLogout?.();
    await logoutPendiente;

    expect(guardarTokenAcceso).toHaveBeenCalledWith("tok.acc.nuevo");
    expect(guardarTokenRefresh).toHaveBeenCalledWith("tok.ref.nuevo");
    expect(eliminarTokens).toHaveBeenCalledTimes(1);
  });
});
