import { useEffect, useState } from "react";
import { extraerMensajeError } from "../api/errores";
import {
  listarConsumosPedido,
  listarOpcionesTelaConsumo,
  registrarConsumosPedido,
  type OpcionTelaConsumo,
  type Pedido,
  type UsoTelaPedido,
} from "../api/pedidos";

type FilaConsumo = { tela: string; metros: string };

export default function GestionConsumosPedido({
  pedido,
  puedeRegistrar,
}: {
  pedido: Pedido;
  puedeRegistrar: boolean;
}) {
  const [telas, setTelas] = useState<OpcionTelaConsumo[]>([]);
  const [consumos, setConsumos] = useState<UsoTelaPedido[]>([]);
  const [filas, setFilas] = useState<FilaConsumo[]>([{ tela: "", metros: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    Promise.all([
      listarConsumosPedido(pedido.codigo),
      puedeRegistrar && pedido.estado === "PENDIENTE"
        ? listarOpcionesTelaConsumo()
        : Promise.resolve(null),
    ])
      .then(([paginaConsumos, paginaTelas]) => {
        if (!vigente) return;
        setConsumos(paginaConsumos.results);
        if (paginaTelas) setTelas(paginaTelas.results);
      })
      .catch((e: unknown) => {
        if (vigente) setError(extraerMensajeError(e));
      });
    return () => {
      vigente = false;
    };
  }, [pedido.codigo, pedido.estado, puedeRegistrar]);

  function editarFila(indice: number, campo: keyof FilaConsumo, valor: string) {
    setFilas((actuales) =>
      actuales.map((fila, i) =>
        i === indice ? { ...fila, [campo]: valor } : fila,
      ),
    );
  }

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    setGuardando(true);
    try {
      const nuevos = await registrarConsumosPedido(
        pedido.codigo,
        filas.map((fila) => ({
          tela: Number(fila.tela),
          metros_usados: fila.metros,
        })),
      );
      setConsumos(nuevos);
      setMensaje(
        "Consumos registrados. El inventario se descontará al confirmar el inicio.",
      );
      setFilas([{ tela: "", metros: "" }]);
    } catch (e) {
      setError(extraerMensajeError(e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section
      className="border rounded p-3 mt-3"
      aria-labelledby="titulo-consumos"
    >
      <h3 id="titulo-consumos" className="h5">
        Consumos de tela
      </h3>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {mensaje && (
        <div className="alert alert-success" role="status">
          {mensaje}
        </div>
      )}
      {consumos.length ? (
        <ul className="list-group list-group-flush mb-3">
          {consumos.map((uso) => (
            <li className="list-group-item px-0" key={uso.id}>
              {uso.tela_nombre} ({uso.tela_color}) · {uso.metros_usados} m
              {uso.registrado_por_nombre
                ? ` · Capturó: ${uso.registrado_por_nombre}`
                : ""}
              {uso.confirmado
                ? " · Inventario descontado"
                : " · Pendiente de confirmación"}
              {!uso.vigente && " · Registro reemplazado"}
            </li>
          ))}
        </ul>
      ) : (
        <p>Aún no se han registrado consumos para este pedido.</p>
      )}
      {puedeRegistrar && pedido.estado === "PENDIENTE" && (
        <form onSubmit={(e) => void guardar(e)}>
          <p className="small text-muted">
            La captura no descuenta inventario. La administradora o costurera
            asignada confirma el inicio.
          </p>
          {filas.map((fila, indice) => (
            <div className="row g-2 mb-2" key={indice}>
              <div className="col-12 col-md-7">
                <label
                  className="form-label"
                  htmlFor={`tela-consumo-${indice}`}
                >
                  Tela
                </label>
                <select
                  id={`tela-consumo-${indice}`}
                  className="form-select"
                  required
                  value={fila.tela}
                  onChange={(e) => editarFila(indice, "tela", e.target.value)}
                >
                  <option value="">Selecciona tela</option>
                  {telas.map((tela) => (
                    <option key={tela.id} value={tela.id}>
                      {tela.nombre} · {tela.color} · {tela.metros_disponibles} m
                      disponibles
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-8 col-md-3">
                <label
                  className="form-label"
                  htmlFor={`metros-consumo-${indice}`}
                >
                  Metros
                </label>
                <input
                  id={`metros-consumo-${indice}`}
                  className="form-control"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={fila.metros}
                  onChange={(e) => editarFila(indice, "metros", e.target.value)}
                />
              </div>
              <div className="col-4 col-md-2 d-flex align-items-end">
                <button
                  className="btn btn-outline-danger w-100"
                  type="button"
                  aria-label={`Quitar consumo ${indice + 1}`}
                  disabled={filas.length === 1}
                  onClick={() =>
                    setFilas((actuales) =>
                      actuales.filter((_, i) => i !== indice),
                    )
                  }
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
          {telas.length === 0 && (
            <p role="status">
              No hay telas disponibles en el catálogo de inventario.
            </p>
          )}
          <div className="d-flex flex-wrap gap-2 mt-3">
            <button
              className="btn btn-outline-primary"
              type="button"
              onClick={() =>
                setFilas((actuales) => [...actuales, { tela: "", metros: "" }])
              }
            >
              Agregar tela
            </button>
            <button
              className="btn btn-primary"
              disabled={guardando || telas.length === 0}
            >
              {guardando ? "Guardando…" : "Guardar consumos"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
