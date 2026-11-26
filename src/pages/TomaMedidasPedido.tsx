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
import Aviso from "../components/Aviso";
import IconoFC from "../components/IconoFC";

/* Diseño Figma «04 · Detalle · Registrar toma de medidas» (Frontend ·
 * Costurera): formulario a la izquierda e historial a la derecha. */
export default function TomaMedidasPedido({
  pedido,
  onVolver,
}: {
  pedido: Pedido;
  onVolver?: () => void;
}) {
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
    <div className="fc-grid-2">
      <section className="fc-card" aria-labelledby="titulo-toma-medidas">
        <div className="fc-card__titulo">
          <IconoFC nombre="editar" size={20} />
          <h3 id="titulo-toma-medidas">
            Medidas del pedido · {pedido.prenda_nombre}
          </h3>
          <span className="fc-card__meta">Todo en centímetros</span>
        </div>
        <p className="mb-0">Registra las medidas del cuerpo en centímetros.</p>
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
        {cargando ? (
          <p aria-live="polite">Cargando medidas…</p>
        ) : (
          <form onSubmit={(e) => void guardar(e)} className="fc-form">
            <div className="fc-campos-medida">
              {campos.map((campo) => (
                <div key={campo.codigo}>
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
            </div>
            <div className="fc-form__acciones">
              {onVolver && (
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={onVolver}
                >
                  Cancelar
                </button>
              )}
              <button
                className="btn btn-primary"
                disabled={guardando || campos.length === 0}
              >
                {guardando ? "Guardando…" : "Guardar nueva toma"}
              </button>
            </div>
          </form>
        )}
      </section>
      <section className="fc-card" aria-labelledby="titulo-historial-medidas">
        <div className="fc-card__titulo">
          <IconoFC nombre="aguja" size={20} />
          <h3 id="titulo-historial-medidas">Historial autorizado</h3>
        </div>
        {!cargando && historial.length === 0 ? (
          <p className="fc-ayuda">
            No hay tomas registradas para los pedidos asignados.
          </p>
        ) : (
          <>
            {historial.map((toma) => (
              <article key={toma.id} className="fc-toma-historial">
                <p className="fc-subtitulo">
                  {new Date(toma.fecha).toLocaleDateString("es-EC")} ·{" "}
                  {toma.categoria} · {toma.prenda ?? "Bebé"}
                </p>
                <ul className="fc-pildoras">
                  {Object.entries(toma.valores_cm).map(([codigo, valor]) => (
                    <li key={codigo}>
                      {codigo}: {valor} cm
                    </li>
                  ))}
                </ul>
              </article>
            ))}
            {
              <div className="fc-paginacion">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
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
                  className="btn btn-sm btn-outline-primary"
                  disabled={paginaHistorial >= Math.ceil(totalHistorial / 20)}
                  onClick={() => setPaginaHistorial((actual) => actual + 1)}
                >
                  Siguiente
                </button>
              </div>
            }
          </>
        )}
      </section>
    </div>
  );
}
