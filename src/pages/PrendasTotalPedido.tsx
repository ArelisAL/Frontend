import { useEffect, useState } from "react";
import { extraerMensajeError } from "../api/errores";
import {
  agregarServicioPedido,
  cerrarTotalPedido,
  listarServiciosCotizables,
  listarServiciosPedido,
  quitarServicioPedido,
  type Pedido,
  type ServicioCotizable,
  type ServicioPedido,
} from "../api/pedidos";
import Aviso from "../components/Aviso";
import IconoFC from "../components/IconoFC";

/**
 * Tarjeta «Prendas y total» (Figma, Recepcionista 09). Decisión C1: el precio
 * sale del catálogo de servicios y la recepcionista cierra el total cuando la
 * clienta ya no tiene más prendas que añadir. Las reglas y la suma las aplica
 * el Backend; aquí solo se muestran y se envían los datos.
 */
export default function PrendasTotalPedido({
  pedido,
  puedeCerrar,
  onTotalCerrado,
}: {
  pedido: Pedido;
  puedeCerrar: boolean;
  onTotalCerrado: (pedido: Pedido) => void;
}) {
  const [lineas, setLineas] = useState<ServicioPedido[]>([]);
  const [catalogo, setCatalogo] = useState<ServicioCotizable[]>([]);
  const [servicio, setServicio] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const cerrado = Boolean(pedido.total_cerrado_en);

  useEffect(() => {
    let vigente = true;
    Promise.all([
      listarServiciosPedido(pedido.codigo),
      cerrado ? Promise.resolve(null) : listarServiciosCotizables(),
    ])
      .then(([datosLineas, datosCatalogo]) => {
        if (!vigente) return;
        setLineas(datosLineas);
        if (datosCatalogo) setCatalogo(datosCatalogo.results);
      })
      .catch((e: unknown) => {
        if (vigente) setError(extraerMensajeError(e));
      });
    return () => {
      vigente = false;
    };
  }, [pedido.codigo, cerrado]);

  const totalAbierto = lineas.reduce(
    (suma, linea) => suma + Number(linea.subtotal),
    0,
  );
  const prendas = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);

  async function agregar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    setEnviando(true);
    try {
      const linea = await agregarServicioPedido(
        pedido.codigo,
        Number(servicio),
        Number(cantidad),
      );
      setLineas((actuales) => [...actuales, linea]);
      setServicio("");
      setCantidad("1");
    } catch (e) {
      setError(extraerMensajeError(e));
    } finally {
      setEnviando(false);
    }
  }

  async function quitar(lineaId: number) {
    setError(null);
    setMensaje(null);
    try {
      await quitarServicioPedido(pedido.codigo, lineaId);
      setLineas((actuales) => actuales.filter((l) => l.id !== lineaId));
    } catch (e) {
      setError(extraerMensajeError(e));
    }
  }

  async function cerrar() {
    if (
      !window.confirm(
        `¿Cierras el total de ${pedido.codigo} en $${totalAbierto.toFixed(2)}? Después ya no se puede cambiar.`,
      )
    )
      return;
    setError(null);
    setEnviando(true);
    try {
      const actualizado = await cerrarTotalPedido(pedido.codigo);
      setMensaje("Total cerrado. Ya puedes registrar abonos.");
      onTotalCerrado(actualizado);
    } catch (e) {
      setError(extraerMensajeError(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="fc-card" aria-labelledby="titulo-prendas-total">
      <div className="fc-card__titulo">
        <IconoFC nombre="prenda" size={20} />
        <h3 id="titulo-prendas-total">Prendas y total</h3>
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
      {lineas.length ? (
        <ul className="fc-consumos">
          {lineas.map((linea) => (
            <li key={linea.id}>
              <span>
                {linea.servicio_nombre} · × {linea.cantidad} · $
                {Number(linea.precio_unitario).toFixed(2)} c/u
              </span>
              <strong>${Number(linea.subtotal).toFixed(2)}</strong>
              {!cerrado && (
                <button
                  type="button"
                  className="fc-chip-accion"
                  aria-label={`Quitar ${linea.servicio_nombre}`}
                  onClick={() => void quitar(linea.id)}
                >
                  Quitar
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-0">Aún no hay prendas del catálogo en este pedido.</p>
      )}
      <div className="fc-saldo fc-saldo--pendiente">
        <small>
          {cerrado ? "Total cerrado" : "Total abierto"} · {prendas} prendas
        </small>
        <strong>
          ${(cerrado ? Number(pedido.total) : totalAbierto).toFixed(2)}
        </strong>
      </div>
      {!cerrado && (
        <>
          <form className="fc-form__fila" onSubmit={(e) => void agregar(e)}>
            <div>
              <label className="form-label" htmlFor="servicio-pedido">
                Agregar prenda del catálogo
              </label>
              <select
                id="servicio-pedido"
                className="form-select"
                required
                value={servicio}
                onChange={(e) => setServicio(e.target.value)}
              >
                <option value="">Selecciona un servicio</option>
                {catalogo.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre} · ${Number(item.tarifa_base).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="cantidad-servicio">
                Cantidad
              </label>
              <input
                id="cantidad-servicio"
                className="form-control"
                type="number"
                min="1"
                step="1"
                required
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-end">
              <button
                className="btn btn-outline-primary w-100"
                disabled={enviando}
              >
                Agregar
              </button>
            </div>
          </form>
          <Aviso>
            El precio sale del catálogo de servicios. Cuando la clienta ya no
            tenga más prendas que añadir, cierra el total: después ya no se
            puede cambiar y se habilitan los abonos.
          </Aviso>
          {puedeCerrar && (
            <button
              type="button"
              className="btn btn-primary w-100"
              disabled={enviando || lineas.length === 0}
              onClick={() => void cerrar()}
            >
              Cerrar total · ${totalAbierto.toFixed(2)}
            </button>
          )}
        </>
      )}
    </section>
  );
}
