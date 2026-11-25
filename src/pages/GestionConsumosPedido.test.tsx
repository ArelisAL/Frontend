import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listarConsumosPedido,
  listarOpcionesTelaConsumo,
  registrarConsumosPedido,
} from "../api/pedidos";
import GestionConsumosPedido from "./GestionConsumosPedido";

vi.mock("../api/pedidos", () => ({
  listarConsumosPedido: vi.fn(),
  listarOpcionesTelaConsumo: vi.fn(),
  registrarConsumosPedido: vi.fn(),
}));

const consumosApi = vi.mocked(listarConsumosPedido);
const telasApi = vi.mocked(listarOpcionesTelaConsumo);
const guardarApi = vi.mocked(registrarConsumosPedido);

const paginaVacia = { count: 0, next: null, previous: null, results: [] };
const pedido = {
  id: 1,
  codigo: "FC-0001",
  cliente: 1,
  cliente_nombre: "Cliente de prueba",
  prenda: 1,
  prenda_nombre: "Blusa",
  categoria_codigo: "MUJER",
  descripcion: "",
  fecha_entrega: "2026-12-01",
  estado: "PENDIENTE",
  costurera: null,
  costurera_nombre: null,
  nota_interna: "",
  total: "0.00",
  creado_en: "2026-11-24T12:00:00Z",
  entregado_en: null,
  medidas_ultima_toma: null,
};

describe("GestionConsumosPedido", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumosApi.mockResolvedValue(paginaVacia);
    telasApi.mockResolvedValue({
      ...paginaVacia,
      count: 1,
      results: [
        {
          id: 3,
          nombre: "Algodón",
          color: "Lila",
          metros_disponibles: "8.00",
        },
      ],
    });
    guardarApi.mockResolvedValue([]);
  });

  it("permite a recepción capturar consumos y los guarda por la API", async () => {
    render(<GestionConsumosPedido pedido={pedido} puedeRegistrar />);

    fireEvent.change(await screen.findByLabelText("Tela"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("Metros"), {
      target: { value: "1.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar consumos" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "El inventario se descontará al confirmar el inicio.",
    );
    expect(guardarApi).toHaveBeenCalledWith("FC-0001", [
      { tela: 3, metros_usados: "1.5" },
    ]);
  });
});
