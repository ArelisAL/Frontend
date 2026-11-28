import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrendasTotalPedido from "./PrendasTotalPedido";
import {
  agregarServicioPedido,
  cerrarTotalPedido,
  listarServiciosCotizables,
  listarServiciosPedido,
  type Pedido,
} from "../api/pedidos";

vi.mock("../api/pedidos", () => ({
  agregarServicioPedido: vi.fn(),
  cerrarTotalPedido: vi.fn(),
  listarServiciosCotizables: vi.fn(),
  listarServiciosPedido: vi.fn(),
  quitarServicioPedido: vi.fn(),
}));

const pedido: Pedido = {
  id: 1,
  codigo: "FC-2045",
  cliente: 3,
  cliente_nombre: "Clienta Ficticia",
  prenda: 2,
  prenda_nombre: "Falda",
  categoria_codigo: "MUJER",
  descripcion: "",
  fecha_entrega: "2026-12-02",
  estado: "PENDIENTE",
  costurera: null,
  costurera_nombre: null,
  nota_interna: "",
  total: "0.00",
  total_cerrado_en: null,
  creado_en: "2026-11-20T10:00:00Z",
  entregado_en: null,
  medidas_ultima_toma: null,
};

const linea = {
  id: 7,
  servicio: 1,
  servicio_nombre: "Arreglo de basta",
  cantidad: 2,
  precio_unitario: "5.00",
  subtotal: "10.00",
  detalle: "",
  creado_en: "2026-11-20T10:00:00Z",
};

describe("PrendasTotalPedido", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listarServiciosCotizables).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          codigo: "basta",
          nombre: "Arreglo de basta",
          categoria: "Arreglos",
          unidad: "prenda",
          tarifa_base: "5.00",
        },
      ],
    });
  });

  it("agrega una prenda del catálogo y la recepcionista cierra el total", async () => {
    vi.mocked(listarServiciosPedido).mockResolvedValueOnce([]);
    vi.mocked(agregarServicioPedido).mockResolvedValueOnce(linea);
    vi.mocked(cerrarTotalPedido).mockResolvedValueOnce({
      ...pedido,
      total: "10.00",
      total_cerrado_en: "2026-11-27T10:00:00Z",
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onTotalCerrado = vi.fn();
    render(
      <PrendasTotalPedido
        pedido={pedido}
        puedeCerrar
        onTotalCerrado={onTotalCerrado}
      />,
    );
    const selector = await screen.findByLabelText(
      "Agregar prenda del catálogo",
    );
    await screen.findByRole("option", { name: /Arreglo de basta/ });
    fireEvent.change(selector, { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Cantidad"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(
      await screen.findByText(/Arreglo de basta · × 2/),
    ).toBeInTheDocument();
    expect(screen.getAllByText("$10.00")).toHaveLength(2);
    expect(agregarServicioPedido).toHaveBeenCalledWith("FC-2045", 1, 2);

    fireEvent.click(screen.getByRole("button", { name: /Cerrar total/ }));
    await waitFor(() =>
      expect(cerrarTotalPedido).toHaveBeenCalledWith("FC-2045"),
    );
    expect(onTotalCerrado).toHaveBeenCalled();
  });

  it("sin permiso de cierre no muestra el botón y con total cerrado no permite cambios", async () => {
    vi.mocked(listarServiciosPedido).mockResolvedValue([linea]);
    const { rerender } = render(
      <PrendasTotalPedido
        pedido={pedido}
        puedeCerrar={false}
        onTotalCerrado={vi.fn()}
      />,
    );
    await screen.findByText(/Arreglo de basta · × 2/);
    expect(screen.queryByRole("button", { name: /Cerrar total/ })).toBeNull();

    rerender(
      <PrendasTotalPedido
        pedido={{
          ...pedido,
          total: "10.00",
          total_cerrado_en: "2026-11-27T10:00:00Z",
        }}
        puedeCerrar
        onTotalCerrado={vi.fn()}
      />,
    );
    expect(await screen.findByText(/Total cerrado/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Quitar/ })).toBeNull();
    expect(screen.queryByLabelText("Agregar prenda del catálogo")).toBeNull();
  });
});
