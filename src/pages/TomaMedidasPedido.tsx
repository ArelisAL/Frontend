import { useEffect, useState } from "react";
import {
  listarCategorias,
  listarMedidasCliente,
  listarMedidasPrenda,
  registrarMedida,
  type Medida,
  type PrendaMedida,
  type TipoMedida,
} from "../api/clientes";
import { extraerMensajeError } from "../api/errores";
import type { Pedido } from "../api/pedidos";

export default function TomaMedidasPedido({ pedido }: { pedido: Pedido }) {
  const [campos, setCampos] = useState<(TipoMedida | PrendaMedida)[]>([]);
  const [historial, setHistorial] = useState<Medida[]>([]);
  const [paginaHistorial, setPaginaHistorial] = useState(1);
  const [totalHistorial, setTotalHistorial] = useState(0);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);
    Promise.all([
      listarCategorias(),
      listarMedidasCliente(pedido.cliente, paginaHistorial),
    ])
      .then(async ([categorias, medidas]) => {
        if (!activo) return;
        const categoria = categorias.results.find(
          (item) => item.codigo === pedido.categoria_codigo,
        );
        if (!categoria) throw new Error("La categoría no está en el catálogo.");
        const requisitos =
          pedido.categoria_codigo === "BEBE"
            ? null
            : await listarMedidasPrenda(pedido.prenda);
        if (!activo) return;
        setCampos(
          pedido.categoria_codigo === "BEBE"
            ? categoria.tipos_medida
            : (requisitos?.results ?? []),
        );
        setHistorial(medidas.results);
        setTotalHistorial(medidas.count);
        setCargando(false);
      })
      .catch((e: unknown) => {
        if (!activo) return;
        setError(extraerMensajeError(e));
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [pedido.categoria_codigo, pedido.cliente, pedido.prenda, paginaHistorial]);

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    const faltantes = campos.filter(
      (campo) =>
        !("opcional" in campo && campo.opcional) &&
        !valores[campo.codigo]?.trim(),
    );
    if (faltantes.length) {
      setError("Completa todas las medidas obligatorias.");
      return;
    }
    const valoresCm: Record<string, number> = {};
    campos.forEach((campo) => {
      const valor = valores[campo.codigo]?.trim();
      if (valor) valoresCm[campo.codigo] = Number(valor);
    });
    setGuardando(true);
    try {
      await registrarMedida(pedido.cliente, {
        categoria: pedido.categoria_codigo,
        prenda: pedido.categoria_codigo === "BEBE" ? null : pedido.prenda,
        valores_cm: valoresCm,
      });
      const medidas = await listarMedidasCliente(pedido.cliente, 1);
      setHistorial(medidas.results);
      setPaginaHistorial(1);
      setTotalHistorial(medidas.count);
      setValores({});
      setMensaje("Toma de medidas guardada en el historial.");
    } catch (e) {
      setError(extraerMensajeError(e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="border rounded p-3 mt-4">
      <h3 className="h5">Medidas del pedido · {pedido.prenda_nombre}</h3>
      <p>Registra las medidas del cuerpo en centímetros.</p>
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
      {cargando ? (
        <p aria-live="polite">Cargando medidas…</p>
      ) : (
        <>
          <form onSubmit={(e) => void guardar(e)} className="row g-3">
            {campos.map((campo) => (
              <div className="col-12 col-md-6" key={campo.codigo}>
                <label
                  className="form-label"
                  htmlFor={`medida-${campo.codigo}`}
                >
                  {campo.nombre}
                  {"opcional" in campo && campo.opcional
                    ? " (opcional)"
                    : ""}{" "}
                  (cm)
                </label>
                <input
                  id={`medida-${campo.codigo}`}
                  type="number"
                  min="0.1"
                  step="0.1"
                  inputMode="decimal"
                  className="form-control"
                  value={valores[campo.codigo] ?? ""}
                  onChange={(e) =>
                    setValores((actual) => ({
                      ...actual,
                      [campo.codigo]: e.target.value,
                    }))
                  }
                  aria-describedby={`ayuda-${campo.codigo}`}
                />
                <div className="form-text" id={`ayuda-${campo.codigo}`}>
                  {campo.como_se_toma}
                </div>
              </div>
            ))}
            <div className="col-12">
              <button
                className="btn btn-primary"
                disabled={guardando || campos.length === 0}
              >
                {guardando ? "Guardando…" : "Guardar nueva toma"}
              </button>
            </div>
          </form>
          <h4 className="h6 mt-4">Historial autorizado</h4>
          {historial.length === 0 ? (
            <p>No hay tomas registradas para los pedidos asignados.</p>
          ) : (
            <>
              {historial.map((toma) => (
                <article key={toma.id} className="border rounded p-3 mb-2">
                  <strong>
                    {toma.categoria} · {toma.prenda ?? "Bebé"}
                  </strong>
                  <div>{new Date(toma.fecha).toLocaleDateString("es-EC")}</div>
                  <ul className="mb-0">
                    {Object.entries(toma.valores_cm).map(([codigo, valor]) => (
                      <li key={codigo}>
                        {codigo}: {valor} cm
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
              <div className="d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={paginaHistorial <= 1}
                  onClick={() => setPaginaHistorial((actual) => actual - 1)}
                >
                  Anterior
                </button>
                <span>
                  Página {paginaHistorial} de{" "}
                  {Math.max(1, Math.ceil(totalHistorial / 20))}
                </span>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={paginaHistorial >= Math.ceil(totalHistorial / 20)}
                  onClick={() => setPaginaHistorial((actual) => actual + 1)}
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
