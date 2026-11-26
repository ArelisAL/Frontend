import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listarConsumosPedido, type Pedido } from "../api/pedidos";
import DialogoAvanceEstado from "./DialogoAvanceEstado";

vi.mock("../api/pedidos", () => ({ listarConsumosPedido: vi.fn() }));

const consumosApi = vi.mocked(listarConsumosPedido);

const pedido: Pedido = {
  id: 1,
  codigo: "FC-0001",
  cliente: 1,
  cliente_nombre: "Cliente de prueba",
  prenda: 1,
  prenda_nombre: "Falda",
  categoria_codigo: "MUJER",
  descripcion: "",
  fecha_entrega: "2026-12-02",
  estado: "PENDIENTE",
  costurera: 7,
  costurera_nombre: "Costurera de prueba",
  nota_interna: "",
  total: "0.00",
  creado_en: "2026-11-20T12:00:00Z",
  entregado_en: null,
  medidas_ultima_toma: null,
};

describe("DialogoAvanceEstado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumosApi.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 4,
          tela: 3,
          tela_nombre: "Gabardina",
          tela_color: "Azul",
          metros_usados: "1.50",
          registrado_por_nombre: "Recepción",
          confirmado: false,
          vigente: true,
          reemplazado_en: null,
          reemplazado_por_nombre: null,
          fecha: "2026-11-20T12:00:00Z",
        },
      ],
    });
  });

  it("muestra las telas a descontar y confirma o cancela sin decidir nada", async () => {
    const onConfirmar = vi.fn();
    const onCancelar = vi.fn();
    render(
      <DialogoAvanceEstado
        pedido={pedido}
        enviando={false}
        onConfirmar={onConfirmar}
        onCancelar={onCancelar}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "¿Pasar FC-0001 a «En proceso»?" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Gabardina · Azul")).toBeInTheDocument();
    expect(consumosApi).toHaveBeenCalledWith("FC-0001");

    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar y descontar telas" }),
    );
    expect(onConfirmar).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancelar).toHaveBeenCalledTimes(1);
  });
});
