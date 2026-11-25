import { afterEach, describe, expect, it, vi } from "vitest";
import {
  detenerRastreoInactividad,
  iniciarRastreoInactividad,
} from "./session";
import { registrarActividad } from "./actividad";
import { cerrarSesion } from "../api/auth";

vi.mock("../api/auth", () => ({
  cerrarSesion: vi.fn().mockResolvedValue(undefined),
}));

describe("sesión por inactividad", () => {
  afterEach(() => {
    detenerRastreoInactividad();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("cierra la sesión y desmonta el estado autenticado tras 30 minutos", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    registrarActividad();
    const limpiarEstadoAutenticado = vi.fn();

    iniciarRastreoInactividad(limpiarEstadoAutenticado);
    await vi.advanceTimersByTimeAsync(30 * 60 * 1000);

    expect(limpiarEstadoAutenticado).toHaveBeenCalledOnce();
    expect(cerrarSesion).toHaveBeenCalledOnce();
  });
});
