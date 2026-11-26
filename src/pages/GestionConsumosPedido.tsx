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
import Aviso from "../components/Aviso";
import IconoFC from "../components/IconoFC";

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
    <section className="fc-card" aria-labelledby="titulo-consumos">
      <div className="fc-card__titulo">
        <IconoFC nombre="carrete" size={20} />
        <h3 id="titulo-consumos">Consumos de tela</h3>
      </div>
      {error && (
        <Aviso tono="error" role="alert">
          {error}
        </Aviso>
      )}
      {mensaje && (
        <Aviso tono="exito" icono="cheque" role="status">
          {mensaje}
        </Aviso>
      )}
      {consumos.length ? (
        <ul className="fc-consumos">
          {consumos.map((uso) => (
            <li key={uso.id}>
              <span>
                {uso.tela_nombre} ({uso.tela_color})
                {uso.registrado_por_nombre
                  ? ` · Capturó: ${uso.registrado_por_nombre}`
                  : ""}
                {uso.confirmado
                  ? " · Inventario descontado"
                  : " · Pendiente de confirmación"}
                {!uso.vigente && " · Registro reemplazado"}
              </span>
              <strong>{uso.metros_usados} m</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-0">
          Aún no se han registrado consumos para este pedido.
        </p>
      )}
      {pedido.estado === "PENDIENTE" && consumos.length > 0 && (
        <Aviso>
          Al confirmar «En proceso» se descuentan estos metros del inventario.
          Si no alcanza el stock, se rechaza todo el cambio y no se descuenta
          nada.
        </Aviso>
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
