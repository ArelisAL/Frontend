import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPage from "./DashboardPage";
import { obtenerUsuarioActual, type Usuario } from "../api/auth";

vi.mock("../api/auth", () => ({ obtenerUsuarioActual: vi.fn() }));

const apiYo = vi.mocked(obtenerUsuarioActual);

const yo: Usuario = {
  id: 7,
  nombre: "Ana",
  email: "ana@fran.com",
  rol: "costurera",
  activo: true,
  debe_cambiar_contraseña: false,
};

describe("DashboardPage (Frontend)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("estado de carga: muestra indicador y luego el nombre del usuario", async () => {
    apiYo.mockResolvedValueOnce(yo);
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText("Cargando")).toBeInTheDocument();
    expect(await screen.findByText(/Bienvenido, Ana/i)).toBeInTheDocument();
    expect(screen.getByText(/ana@fran\.com/)).toBeInTheDocument();
  });

  it("estado de error: muestra mensaje si falla", async () => {
    apiYo.mockRejectedValueOnce({
      response: { status: 500, data: { detalle: "error_interno" } },
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/error_interno/i)).toBeInTheDocument();
  });
});
