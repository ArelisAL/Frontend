import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { extraerMensajeError } from "../api/errores";
import { listarPagos } from "../api/pagos";
import {
  cambiarEstadoPedido,
  listarPedidos,
  type Pedido,
} from "../api/pedidos";
import Aviso from "../components/Aviso";
import EncabezadoPagina from "../components/EncabezadoPagina";
import IconoFC from "../components/IconoFC";
import InsigniaEstado from "../components/InsigniaEstado";

/**
 * Pantalla «07 · Entregas» del diseño Figma. Lista los pedidos TERMINADO con
 * /pedidos/, consulta el saldo con /pedidos/{codigo}/pagos/ y registra la
 * entrega con /pedidos/{codigo}/estado/ (decisión C2: la recepcionista marca
 * «Entregado»). El bloqueo por saldo lo decide el Backend (409 saldo_pendiente,
 * decisión C3); aquí solo se deshabilita el botón para ayudar.
 */
export default function EntregasPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<Pedido | null>(null);
  const [saldo, setSaldo] = useState<string | null>(null);
  const [entregando, setEntregando] = useState(false);
  const [exito, setExito] = useState<string | null>(null);
  const solicitud = useRef(0);

  async function cargar(texto = busqueda, numero = 1) {
    setError(null);
    try {
      const resultado = await listarPedidos(texto.trim(), numero, "TERMINADO");
      setPedidos(resultado.results);
      setTotal(resultado.count);
      setPagina(numero);
    } catch (e) {
      setError(extraerMensajeError(e));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar("", 1);
    // Solo la carga inicial; las búsquedas llaman a cargar() directamente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function revisar(pedido: Pedido) {
    const actual = ++solicitud.current;
    setSeleccionado(pedido);
    setSaldo(null);
    setExito(null);
    try {
      const pagos = await listarPagos(pedido.codigo);
      if (actual === solicitud.current) setSaldo(pagos.saldo);
    } catch (e) {
      if (actual === solicitud.current) setError(extraerMensajeError(e));
    }
  }

  async function confirmarEntrega() {
    if (!seleccionado) return;
    setEntregando(true);
    setError(null);
    try {
      await cambiarEstadoPedido(seleccionado.codigo);
      setExito(
        `${seleccionado.codigo} se entregó y ya no aparece en el tablero de pedidos activos.`,
      );
      solicitud.current++;
      setSeleccionado(null);
      setSaldo(null);
      await cargar(busqueda, 1);
    } catch (e) {
      setError(extraerMensajeError(e));
    } finally {
      setEntregando(false);
    }
  }

  const paginas = Math.max(1, Math.ceil(total / 20));

  return (
    <main className="fc-page">
      <EncabezadoPagina
        etiqueta="ENTREGAS"
        titulo="Entregas"
        descripcion="Pedidos terminados listos para retirar. Revisa el saldo con la clienta antes de entregar."
      />
      {error && (
        <Aviso tono="error" role="alert">
          {error}
        </Aviso>
      )}
      {exito && (
        <Aviso tono="exito" icono="cheque">
          {exito}
        </Aviso>
      )}
      <div className="fc-grid-2">
        <section className="fc-card" aria-labelledby="titulo-entregas">
          <div className="fc-card__titulo">
            <IconoFC nombre="calendario" size={20} />
            <h2 id="titulo-entregas">Listos para entregar</h2>
            <span className="fc-card__meta">{total} pedidos</span>
          </div>
          <form
            className="fc-buscador"
            onSubmit={(e) => {
              e.preventDefault();
              void cargar(busqueda, 1);
            }}
          >
            <label className="visually-hidden" htmlFor="buscar-entrega">
              Código o nombre del cliente
            </label>
            <span className="fc-campo-icono">
              <IconoFC nombre="buscar" size={18} />
              <input
                id="buscar-entrega"
                className="form-control"
                placeholder="Código o nombre del cliente"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </span>
            <button className="btn btn-outline-primary">Buscar</button>
          </form>
          {cargando ? (
            <p aria-live="polite">Cargando entregas…</p>
          ) : pedidos.length === 0 ? (
            <p className="fc-vacio">No hay pedidos terminados por entregar.</p>
          ) : (
            <>
              <div className="fc-tabla-card table-responsive">
                <table className="table fc-tabla mb-0">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>Prenda</th>
                      <th>Entrega</th>
                      <th>Estado</th>
                      <th>
                        <span className="visually-hidden">Acción</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((pedido) => (
                      <tr
                        key={pedido.id}
                        className={
                          seleccionado?.codigo === pedido.codigo
                            ? "is-selected"
                            : ""
                        }
                      >
                        <td className="fw-bold">{pedido.codigo}</td>
                        <td>{pedido.cliente_nombre}</td>
                        <td>{pedido.prenda_nombre}</td>
                        <td>
                          <span className="fc-fecha">
                            <IconoFC nombre="calendario" size={16} />
                            {pedido.fecha_entrega}
                          </span>
                        </td>
                        <td>
                          <InsigniaEstado estado={pedido.estado} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="fc-chip-accion"
                            onClick={() => void revisar(pedido)}
                          >
                            <IconoFC nombre="cheque" size={14} />
                            Entregar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="fc-paginacion">
                <button
                  className="btn btn-outline-primary"
                  disabled={pagina <= 1}
                  onClick={() => void cargar(busqueda, pagina - 1)}
                >
                  Anterior
                </button>
                <span>
                  Página {pagina} de {paginas}
                </span>
                <button
                  className="btn btn-outline-primary"
                  disabled={pagina >= paginas}
                  onClick={() => void cargar(busqueda, pagina + 1)}
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </section>
        <section
          className="fc-card fc-card--destacada"
          aria-labelledby="titulo-revision"
        >
          <div className="fc-card__titulo">
            <IconoFC nombre="cheque" size={20} />
            <h2 id="titulo-revision">Confirmar entrega</h2>
            {seleccionado && (
              <span className="fc-card__meta">{seleccionado.codigo}</span>
            )}
          </div>
          {!seleccionado ? (
            <p className="fc-ayuda">
              Elige un pedido de la lista para ver su saldo antes de entregarlo.
            </p>
          ) : (
            <>
              <p className="fw-bold mb-2">
                {seleccionado.cliente_nombre} · {seleccionado.prenda_nombre}
              </p>
              <div className="fc-transicion">
                <InsigniaEstado estado="TERMINADO" />
                <IconoFC nombre="flecha" size={16} />
                <InsigniaEstado estado="ENTREGADO" />
              </div>
              <div className="fc-saldos">
                <div className="fc-saldo">
                  <small>Total del pedido</small>
                  <strong>${Number(seleccionado.total).toFixed(2)}</strong>
                </div>
                <div className="fc-saldo fc-saldo--pendiente">
                  <small>Saldo pendiente</small>
                  <strong>
                    {saldo === null ? "…" : `$${Number(saldo).toFixed(2)}`}
                  </strong>
                </div>
              </div>
              {saldo !== null && Number(saldo) > 0 && (
                <Aviso tono="error">
                  Este pedido tiene saldo pendiente de $
                  {Number(saldo).toFixed(2)}. Registra el abono antes de
                  entregarlo.
                </Aviso>
              )}
              {saldo !== null && Number(saldo) <= 0 && (
                <Aviso tono="exito" icono="cheque">
                  El pedido no tiene saldo pendiente.
                </Aviso>
              )}
              <Link className="btn btn-primary w-100" to="/pedidos#cobros">
                {saldo !== null && Number(saldo) > 0
                  ? `Registrar abono de $${Number(saldo).toFixed(2)}`
                  : "Ir a cobros y abonos"}
              </Link>
              <div className="fc-form__fila mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    solicitud.current++;
                    setSeleccionado(null);
                    setSaldo(null);
                  }}
                  disabled={entregando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => void confirmarEntrega()}
                  disabled={entregando || saldo === null || Number(saldo) > 0}
                >
                  {entregando ? "Confirmando…" : "Confirmar entrega"}
                </button>
              </div>
              <p className="fc-ayuda mt-3 mb-0">
                Al confirmar se guarda la fecha real de entrega y el usuario que
                entregó. Esta acción no se puede deshacer.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
