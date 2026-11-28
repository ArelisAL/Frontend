import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";
import { cerrarSesion, login, obtenerUsuarioActual } from "../api/auth";

vi.mock("../api/auth", () => ({
  login: vi.fn(),
  loginConGoogle: vi.fn(),
  cerrarSesion: vi.fn(),
  obtenerUsuarioActual: vi.fn(),
  sesionActiva: vi.fn(() => false),
}));
const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const apiLogin = vi.mocked(login);
const apiYo = vi.mocked(obtenerUsuarioActual);
const apiCerrarSesion = vi.mocked(cerrarSesion);

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage (DERCAS §4, SEG: mensajes de la API)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiCerrarSesion.mockResolvedValue();
  });

  it("estado vacío: muestra campos de correo y contraseña y el botón Iniciar sesión", () => {
    renderLogin();
    expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/¿Cómo ingresas\?/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Continuar con Google/i }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: /Entrar a mi espacio/i }),
    ).toBeEnabled();
  });

  it("al enviar: llama a login con los credenciales ingresados y navega al dashboard", async () => {
    apiLogin.mockResolvedValueOnce({ access: "a", refresh: "r" });
    apiYo.mockResolvedValueOnce({
      id: 7,
      nombre: "Ana",
      email: "ana@fran.com",
      rol: "costurera",
      activo: true,
      debe_cambiar_contraseña: false,
    });
    renderLogin();
    await userEvent.selectOptions(
      screen.getByLabelText(/¿Cómo ingresas\?/i),
      "costurera",
    );
    await userEvent.type(
      screen.getByLabelText(/Correo electrónico/i),
      "ana@fran.com",
    );
    await userEvent.type(
      screen.getByLabelText(/^Contraseña$/i),
      "contraseña123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Entrar a mi espacio/i }),
    );
    expect(apiLogin).toHaveBeenCalledWith({
      email: "ana@fran.com",
      password: "contraseña123",
    });
    expect(apiYo).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("rechaza un rol seleccionado que no coincide con la cuenta autenticada", async () => {
    apiLogin.mockResolvedValueOnce({ access: "a", refresh: "r" });
    apiYo.mockResolvedValueOnce({
      id: 8,
      nombre: "Ana",
      email: "ana@fran.com",
      rol: "recepcionista",
      activo: true,
      debe_cambiar_contraseña: false,
    });
    renderLogin();
    await userEvent.selectOptions(
      screen.getByLabelText(/¿Cómo ingresas\?/i),
      "costurera",
    );
    await userEvent.type(
      screen.getByLabelText(/Correo electrónico/i),
      "ana@fran.com",
    );
    await userEvent.type(
      screen.getByLabelText(/^Contraseña$/i),
      "contraseña123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Entrar a mi espacio/i }),
    );

    expect(apiCerrarSesion).toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /no coincide con tu cuenta/i,
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("estado de error: muestra el mensaje que devuelve la API", async () => {
    apiLogin.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          error: "credenciales_invalidas",
          detalle: "Credenciales inválidos",
        },
      },
    });
    renderLogin();
    await userEvent.type(
      screen.getByLabelText(/Correo electrónico/i),
      "ana@fran.com",
    );
    await userEvent.type(
      screen.getByLabelText(/^Contraseña$/i),
      "contraseña123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Entrar a mi espacio/i }),
    );
    expect(
      await screen.findByText("Credenciales inválidos"),
    ).toBeInTheDocument();
  });
});
