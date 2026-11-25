import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CambiarContrasenaPage from "./CambiarContrasenaPage";
import { cambiarContrasena } from "../api/auth";

vi.mock("../api/auth", () => ({ cambiarContrasena: vi.fn() }));
const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const apiCambiar = vi.mocked(cambiarContrasena);

describe("CambiarContrasenaPage (RF-M0-05)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra inputs de contraseña actual + nueva", () => {
    render(
      <MemoryRouter>
        <CambiarContrasenaPage />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(/Contraseña actual/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nueva contraseña/i)).toBeInTheDocument();
  });

  it("al éxito muestra que queda activado el resto y navega al dashboard", async () => {
    apiCambiar.mockResolvedValueOnce(undefined);
    render(
      <MemoryRouter>
        <CambiarContrasenaPage />
      </MemoryRouter>,
    );
    await userEvent.type(
      screen.getByLabelText(/Contraseña actual/i),
      "contraseña123",
    );
    await userEvent.type(
      screen.getByLabelText(/Nueva contraseña/i),
      "contraseña-nueva",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Cambiar contraseña/i }),
    );
    expect(apiCambiar).toHaveBeenCalledWith(
      "contraseña123",
      "contraseña-nueva",
    );
    expect(await screen.findByText(/queda activado/i)).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("muestra el mensaje de error de la API si falla", async () => {
    apiCambiar.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { detalle: "Contraseña demasiado corta" },
      },
    });
    render(
      <MemoryRouter>
        <CambiarContrasenaPage />
      </MemoryRouter>,
    );
    await userEvent.type(
      screen.getByLabelText(/Contraseña actual/i),
      "contraseña123",
    );
    await userEvent.type(screen.getByLabelText(/Nueva contraseña/i), "corta");
    await userEvent.click(
      screen.getByRole("button", { name: /Cambiar contraseña/i }),
    );
    expect(
      await screen.findByText("Contraseña demasiado corta"),
    ).toBeInTheDocument();
  });
});
