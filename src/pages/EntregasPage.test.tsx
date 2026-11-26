import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EntregasPage from "./EntregasPage";
import { listarPedidos, type Pedido } from "../api/pedidos";
import { listarPagos } from "../api/pagos";

vi.mock("../api/pedidos", () => ({ listarPedidos: vi.fn() }));
vi.mock("../api/pagos", () => ({ listarPagos: vi.fn() }));

const pedido: Pedido = {
  id: 1,
  codigo: "FC-2041",
  cliente: 3,
  cliente_nombre: "Ana Prueba",
  prenda: 2,
  prenda_nombre: "Vestido",
  categoria_codigo: "MUJER",
  descripcion: "",
  fecha_entrega: "2026-11-26",
  estado: "TERMINADO",
  costurera: null,
  costurera_nombre: null,
  nota_interna: "",
  total: "85.00",
  creado_en: "2026-11-20T10:00:00Z",
  entregado_en: null,
  medidas_ultima_toma: null,
};

describe("EntregasPage (vista propuesta, solo interfaz)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista los pedidos terminados y avisa si queda saldo", async () => {
    vi.mocked(listarPedidos).mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: [pedido],
    });
    vi.mocked(listarPagos).mockResolvedValueOnce({
      count: 0,
      next: null,
      previous: null,
      results: [],
      saldo: "35.00",
    });
    render(
      <MemoryRouter>
        <EntregasPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText("FC-2041")).toBeInTheDocument();
    expect(listarPedidos).toHaveBeenCalledWith("", 1, "TERMINADO");
    fireEvent.click(screen.getByRole("button", { name: /Revisar/ }));
    expect(
      await screen.findByText(/saldo pendiente de \$\s*35\.00/),
    ).toBeInTheDocument();
    expect(listarPagos).toHaveBeenCalledWith("FC-2041");
  });
});
