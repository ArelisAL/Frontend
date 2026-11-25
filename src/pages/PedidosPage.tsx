import { useEffect, useRef, useState } from "react";
import { listarClientes, type Cliente } from "../api/clientes";
import { extraerMensajeError } from "../api/errores";
import {
  cambiarEstadoPedido,
  crearPedido,
  guardarNotaInterna,
  listarHistorialPedido,
  listarPedidos,
  listarPedidosParaPagos,
  listarPrendasPedidos,
  obtenerPedido,
  type Pedido,
  type HistorialEstado,
} from "../api/pedidos";
import type { Usuario } from "../api/auth";
import TomaMedidasPedido from "./TomaMedidasPedido";
import GestionConsumosPedido from "./GestionConsumosPedido";
import { listarPagos, registrarPago, type Pago } from "../api/pagos";

export default function PedidosPage({ usuario }: { usuario: Usuario }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [pedidosPago, setPedidosPago] = useState<Pedido[]>([]);
  const [busquedaPago, setBusquedaPago] = useState("");
  const [paginaPedidosPago, setPaginaPedidosPago] = useState(1);
  const [totalPedidosPago, setTotalPedidosPago] = useState(0);
  const [cargandoPedidosPago, setCargandoPedidosPago] = useState(false);
  const [paginaPedidos, setPaginaPedidos] = useState(1);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteBusqueda, setClienteBusqueda] = useState("");
  const [paginaClientes, setPaginaClientes] = useState(1);
  const [totalClientes, setTotalClientes] = useState(0);
  const [prendas, setPrendas] = useState<{ id: number; nombre: string }[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [cliente, setCliente] = useState("");
  const [prenda, setPrenda] = useState("");
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [notaInterna, setNotaInterna] = useState("");
  const [seleccionado, setSeleccionado] = useState<Pedido | null>(null);
  const [historial, setHistorial] = useState<HistorialEstado[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [saldo, setSaldo] = useState("0.00");
  const [montoPago, setMontoPago] = useState("");
  const [paginaPagos, setPaginaPagos] = useState(1);
  const [totalPagos, setTotalPagos] = useState(0);
  const [guardandoPago, setGuardandoPago] = useState(false);
  const solicitudDetalle = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const puedeRegistrar =
    usuario.rol === "administradora" || usuario.rol === "recepcionista";

  async function cargar(
    texto = busqueda,
    numeroPagina = 1,
    estado = estadoFiltro,
  ) {
    const pagina = await listarPedidos(
      texto,
      numeroPagina,
      estado || undefined,
      usuario.rol === "costurera",
    );
    setPedidos(pagina.results);
    setTotalPedidos(pagina.count);
    setPaginaPedidos(numeroPagina);
    setSeleccionado(null);
  }

  useEffect(() => {
    Promise.all([
      listarPedidos("", 1, undefined, usuario.rol === "costurera"),
      listarPrendasPedidos(),
    ])
      .then(([lista, prendasPagina]) => {
        setPedidos(lista.results);
        setTotalPedidos(lista.count);
        setPrendas(prendasPagina.results);
        setCargando(false);
      })
      .catch((e: unknown) => {
        setError(extraerMensajeError(e));
        setCargando(false);
      });
  }, [usuario.rol]);

  useEffect(() => {
    if (!puedeRegistrar) {
      setClientes([]);
      setTotalClientes(0);
      return;
    }
    listarClientes(clienteBusqueda, paginaClientes)
      .then((pagina) => {
        setClientes(pagina.results);
        setTotalClientes(pagina.count);
      })
      .catch((e: unknown) => setError(extraerMensajeError(e)));
  }, [clienteBusqueda, paginaClientes, puedeRegistrar]);

  async function buscarPedidosPago(
    evento?: React.FormEvent<HTMLFormElement>,
    pagina = 1,
  ) {
    evento?.preventDefault();
    setCargandoPedidosPago(true);
    setError(null);
    try {
      const resultado = await listarPedidosParaPagos(
        busquedaPago.trim(),
        pagina,
      );
      setPedidosPago(resultado.results);
      setTotalPedidosPago(resultado.count);
      setPaginaPedidosPago(pagina);
    } catch (e) {
      setError(extraerMensajeError(e));
    } finally {
      setCargandoPedidosPago(false);
    }
  }

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    try {
      await crearPedido({
        cliente: Number(cliente),
        prenda: Number(prenda),
        fecha_entrega: fecha,
        descripcion,
      });
      await cargar("");
      setCliente("");
      setPrenda("");
      setFecha("");
      setDescripcion("");
      setMensaje("Pedido registrado.");
    } catch (e) {
      setError(extraerMensajeError(e));
    }
  }

  async function verDetalle(codigo: string) {
    const solicitud = ++solicitudDetalle.current;
    setError(null);
    setSeleccionado(null);
    setHistorial([]);
    setNotaInterna("");
    setMontoPago("");
    setPagos([]);
    setSaldo("0.00");
    setPaginaPagos(1);
    setTotalPagos(0);
    setGuardandoPago(false);
    try {
      const pedido = await obtenerPedido(codigo);
      if (solicitud !== solicitudDetalle.current) return;
      setSeleccionado(pedido);
      setNotaInterna(pedido.nota_interna);
      const [datosHistorial, datosPagos] = await Promise.all([
        listarHistorialPedido(pedido.codigo),
        puedeRegistrar ? listarPagos(pedido.codigo) : Promise.resolve(null),
      ]);
      if (solicitud !== solicitudDetalle.current) return;
      setHistorial(datosHistorial.results);
      if (datosPagos) {
        setPagos(datosPagos.results);
        setSaldo(datosPagos.saldo);
        setTotalPagos(datosPagos.count);
      } else {
        setPagos([]);
      }
    } catch (e) {
      if (solicitud === solicitudDetalle.current)
        setError(extraerMensajeError(e));
    }
  }

  async function avanzarEstado() {
    if (
      !seleccionado ||
      !window.confirm(
        `¿Confirmas avanzar ${seleccionado.codigo} al siguiente estado?`,
      )
    )
      return;
    setError(null);
    setMensaje(null);
    try {
      await cambiarEstadoPedido(seleccionado.codigo);
      const pedido = await obtenerPedido(seleccionado.codigo);
      setSeleccionado(pedido);
      setHistorial((await listarHistorialPedido(pedido.codigo)).results);
      await cargar(busqueda, paginaPedidos, estadoFiltro);
      setSeleccionado(pedido);
      setMensaje(`Estado actualizado: ${pedido.estado}.`);
    } catch (e) {
      setError(extraerMensajeError(e));
    }
  }

  async function guardarNota(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!seleccionado) return;
    setError(null);
    setMensaje(null);
    try {
      const actualizado = await guardarNotaInterna(
        seleccionado.codigo,
        notaInterna,
      );
      setSeleccionado(actualizado);
      setMensaje("Nota interna guardada.");
    } catch (e) {
      setError(extraerMensajeError(e));
    }
  }

  async function guardarPago(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!seleccionado) return;
    const codigo = seleccionado.codigo;
    const solicitud = solicitudDetalle.current;
    setError(null);
    setMensaje(null);
    setGuardandoPago(true);
    try {
      await registrarPago(codigo, montoPago);
      const pagina = await listarPagos(codigo, paginaPagos);
      if (solicitud !== solicitudDetalle.current) return;
      setPagos(pagina.results);
      setSaldo(pagina.saldo);
      setTotalPagos(pagina.count);
      setMontoPago("");
      setMensaje("Abono registrado.");
    } catch (e) {
      if (solicitud === solicitudDetalle.current)
        setError(extraerMensajeError(e));
    } finally {
      if (solicitud === solicitudDetalle.current) setGuardandoPago(false);
    }
  }

  async function cambiarPaginaPagos(numero: number) {
    if (!seleccionado || numero < 1) return;
    const solicitud = solicitudDetalle.current;
    try {
      const pagina = await listarPagos(seleccionado.codigo, numero);
      if (solicitud !== solicitudDetalle.current) return;
      setPagos(pagina.results);
      setSaldo(pagina.saldo);
      setTotalPagos(pagina.count);
      setPaginaPagos(numero);
    } catch (e) {
      if (solicitud === solicitudDetalle.current)
        setError(extraerMensajeError(e));
    }
  }

  if (cargando)
    return (
      <main className="container py-5" aria-live="polite">
        Cargando pedidos…
      </main>
    );
  return (
    <main className="container py-4" style={{ color: "var(--fc-texto)" }}>
      <h1 style={{ color: "var(--fc-titulo)" }}>Pedidos</h1>
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
      {puedeRegistrar && (
        <section className="card p-3 mb-4">
          <h2 className="h4">Registrar pedido</h2>
          <form className="row g-3" onSubmit={(e) => void guardar(e)}>
            <div className="col-12">
              <label className="form-label" htmlFor="buscar-cliente-pedido">
                Buscar cliente
              </label>
              <input
                id="buscar-cliente-pedido"
                className="form-control"
                value={clienteBusqueda}
                onChange={(e) => {
                  setClienteBusqueda(e.target.value);
                  setPaginaClientes(1);
                }}
                placeholder="Nombre, teléfono o correo"
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="cliente">
                Cliente
              </label>
              <select
                id="cliente"
                className="form-select"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                required
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
              <div className="d-flex justify-content-between align-items-center mt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  disabled={paginaClientes <= 1}
                  onClick={() => setPaginaClientes((actual) => actual - 1)}
                >
                  Anterior
                </button>
                <span>
                  Página {paginaClientes} de{" "}
                  {Math.max(1, Math.ceil(totalClientes / 20))}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  disabled={paginaClientes >= Math.ceil(totalClientes / 20)}
                  onClick={() => setPaginaClientes((actual) => actual + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="prenda">
                Prenda
              </label>
              <select
                id="prenda"
                className="form-select"
                value={prenda}
                onChange={(e) => setPrenda(e.target.value)}
                required
              >
                <option value="">Selecciona una prenda</option>
                {prendas.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="fecha">
                Fecha de entrega
              </label>
              <input
                id="fecha"
                type="date"
                className="form-control"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                min={new Date().toLocaleDateString("en-CA")}
              />
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="descripcion">
                Descripción
              </label>
              <textarea
                id="descripcion"
                className="form-control"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
              />
            </div>
            <div className="col-12">
              <button className="btn btn-primary">Registrar pedido</button>
            </div>
          </form>
        </section>
      )}
      <section className="card p-3">
        <h2 className="h4">Tablero de pedidos activos</h2>
        <form
          className="d-flex flex-column flex-sm-row gap-2 mb-3"
          onSubmit={(e) => {
            e.preventDefault();
            void cargar(busqueda).catch((x: unknown) =>
              setError(extraerMensajeError(x)),
            );
          }}
        >
          <label className="visually-hidden" htmlFor="buscar-pedido">
            Código o nombre del cliente
          </label>
          <input
            id="buscar-pedido"
            className="form-control"
            placeholder="Código o nombre del cliente"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button className="btn btn-outline-primary">Buscar</button>
        </form>
        <div className="mb-3">
          <label className="form-label" htmlFor="filtro-estado">
            Filtrar por estado
          </label>
          <select
            id="filtro-estado"
            className="form-select"
            value={estadoFiltro}
            onChange={(e) => {
              setEstadoFiltro(e.target.value);
              void cargar(busqueda, 1, e.target.value);
            }}
          >
            <option value="">Todos los activos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="TERMINADO">Terminado</option>
            {usuario.rol === "costurera" && (
              <option value="ENTREGADO">Entregado</option>
            )}
          </select>
        </div>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Prenda</th>
                <th>Entrega</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((item) => (
                <tr key={item.id}>
                  <td>{item.codigo}</td>
                  <td>{item.cliente_nombre}</td>
                  <td>{item.prenda_nombre}</td>
                  <td>{item.fecha_entrega}</td>
                  <td>{item.estado}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => void verDetalle(item.codigo)}
                    >
                      Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            className="btn btn-outline-primary"
            disabled={paginaPedidos <= 1}
            onClick={() =>
              void cargar(busqueda, paginaPedidos - 1, estadoFiltro)
            }
          >
            Anterior
          </button>
          <span>
            Página {paginaPedidos} de{" "}
            {Math.max(1, Math.ceil(totalPedidos / 20))}
          </span>
          <button
            className="btn btn-outline-primary"
            disabled={paginaPedidos >= Math.ceil(totalPedidos / 20)}
            onClick={() =>
              void cargar(busqueda, paginaPedidos + 1, estadoFiltro)
            }
          >
            Siguiente
          </button>
        </div>
        {pedidos.length === 0 && <p>No hay pedidos activos para mostrar.</p>}
      </section>
      {puedeRegistrar && (
        <section className="card p-3 mt-4">
          <h2 className="h4">Consultar pedidos y saldos</h2>
          <p>
            Busca también pedidos entregados para revisar sus pagos y saldo.
          </p>
          <form
            className="d-flex flex-column flex-sm-row gap-2 mb-3"
            onSubmit={(e) => void buscarPedidosPago(e)}
          >
            <label className="visually-hidden" htmlFor="buscar-pedido-pago">
              Código o nombre del cliente para consultar pagos
            </label>
            <input
              id="buscar-pedido-pago"
              className="form-control"
              placeholder="Código o nombre del cliente"
              value={busquedaPago}
              onChange={(e) => setBusquedaPago(e.target.value)}
            />
            <button
              className="btn btn-outline-primary"
              disabled={cargandoPedidosPago}
            >
              {cargandoPedidosPago ? "Buscando…" : "Buscar pedidos"}
            </button>
          </form>
          {pedidosPago.length > 0 && (
            <>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>Entrega</th>
                      <th>Estado</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosPago.map((pedido) => (
                      <tr key={pedido.id}>
                        <td>{pedido.codigo}</td>
                        <td>{pedido.cliente_nombre}</td>
                        <td>{pedido.fecha_entrega}</td>
                        <td>{pedido.estado.replace(/_/g, " ")}</td>
                        <td>${Number(pedido.total).toFixed(2)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => void verDetalle(pedido.codigo)}
                          >
                            Ver pagos y saldo
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <button
                  className="btn btn-outline-primary"
                  disabled={paginaPedidosPago <= 1 || cargandoPedidosPago}
                  onClick={() =>
                    void buscarPedidosPago(undefined, paginaPedidosPago - 1)
                  }
                >
                  Anterior
                </button>
                <span>
                  Página {paginaPedidosPago} de{" "}
                  {Math.max(1, Math.ceil(totalPedidosPago / 20))}
                </span>
                <button
                  className="btn btn-outline-primary"
                  disabled={
                    paginaPedidosPago >= Math.ceil(totalPedidosPago / 20) ||
                    cargandoPedidosPago
                  }
                  onClick={() =>
                    void buscarPedidosPago(undefined, paginaPedidosPago + 1)
                  }
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
          {!cargandoPedidosPago && busquedaPago && pedidosPago.length === 0 && (
            <p>No se encontraron pedidos para esa búsqueda.</p>
          )}
        </section>
      )}
      {seleccionado && (
        <section className="card p-3 mt-4">
          <div className="d-flex align-items-start">
            <h2 className="h4 me-auto">
              {seleccionado.codigo} · {seleccionado.prenda_nombre}
            </h2>
            <button
              className="btn btn-outline-secondary"
              onClick={() => setSeleccionado(null)}
            >
              Cerrar
            </button>
          </div>
          <p>
            Cliente: {seleccionado.cliente_nombre} · Entrega:{" "}
            {seleccionado.fecha_entrega} · Estado: {seleccionado.estado}
          </p>
          {(usuario.rol === "administradora" || usuario.rol === "costurera") &&
            seleccionado.estado !== "ENTREGADO" && (
              <button
                className="btn btn-primary mb-3"
                onClick={() => void avanzarEstado()}
              >
                Confirmar siguiente estado
              </button>
            )}
          <h3 className="h5">Historial de estados</h3>
          {historial.map((cambio) => (
            <p key={cambio.id}>
              {cambio.estado_anterior.replace(/_/g, " ")} →{" "}
              {cambio.estado_nuevo.replace(/_/g, " ")} ·{" "}
              {new Date(cambio.fecha_hora).toLocaleString("es-EC")} ·{" "}
              {cambio.usuario_nombre}
            </p>
          ))}
          <p>{seleccionado.descripcion}</p>
          <GestionConsumosPedido
            pedido={seleccionado}
            puedeRegistrar={puedeRegistrar}
          />
          <h3 className="h5">Últimas medidas registradas</h3>
          <form className="mb-3" onSubmit={(e) => void guardarNota(e)}>
            <label className="form-label" htmlFor="nota-interna">
              Nota interna (visible para el personal del taller)
            </label>
            <textarea
              id="nota-interna"
              className="form-control mb-2"
              rows={3}
              value={notaInterna}
              onChange={(e) => setNotaInterna(e.target.value)}
            />
            <button className="btn btn-outline-primary">Guardar nota</button>
          </form>
          {seleccionado.medidas_ultima_toma ? (
            <>
              <p>
                {seleccionado.medidas_ultima_toma.categoria} ·{" "}
                {new Date(
                  seleccionado.medidas_ultima_toma.fecha,
                ).toLocaleDateString("es-EC")}
              </p>
              <ul>
                {Object.entries(
                  seleccionado.medidas_ultima_toma.valores_cm,
                ).map(([codigo, valor]) => (
                  <li key={codigo}>
                    {codigo}: {valor} cm
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>No hay medidas registradas para esta prenda.</p>
          )}
          {usuario.rol === "costurera" && (
            <TomaMedidasPedido pedido={seleccionado} />
          )}
          {puedeRegistrar && (
            <section className="border rounded p-3 mt-4">
              <h3 className="h5">Pagos y saldo</h3>
              <p>
                Total del pedido: ${Number(seleccionado.total).toFixed(2)} ·
                Saldo pendiente: ${Number(saldo).toFixed(2)}
              </p>
              {Number(seleccionado.total) > 0 && Number(saldo) > 0 ? (
                <form
                  className="row g-2 mb-3"
                  onSubmit={(e) => void guardarPago(e)}
                >
                  <div className="col-12 col-sm-7 col-md-5">
                    <label className="form-label" htmlFor="monto-pago">
                      Nuevo abono
                    </label>
                    <input
                      id="monto-pago"
                      className="form-control"
                      type="number"
                      min="0.01"
                      max={saldo}
                      step="0.01"
                      required
                      value={montoPago}
                      onChange={(e) => setMontoPago(e.target.value)}
                    />
                  </div>
                  <div className="col-12 align-self-end">
                    <button
                      className="btn btn-primary"
                      disabled={guardandoPago}
                    >
                      {guardandoPago ? "Guardando…" : "Registrar abono"}
                    </button>
                  </div>
                </form>
              ) : (
                <p>
                  {Number(seleccionado.total) <= 0
                    ? "El total del pedido aún no está definido."
                    : "El pedido no tiene saldo pendiente."}
                </p>
              )}
              {pagos.length === 0 ? (
                <p>No hay abonos registrados.</p>
              ) : (
                <>
                  <ul>
                    {pagos.map((pago) => (
                      <li key={pago.id}>
                        ${Number(pago.monto).toFixed(2)} ·{" "}
                        {new Date(pago.fecha).toLocaleString("es-EC")} ·{" "}
                        {pago.registrado_por_nombre}
                        {pago.anulado ? " · Anulado" : ""}
                      </li>
                    ))}
                  </ul>
                  <div className="d-flex justify-content-between align-items-center">
                    <button
                      className="btn btn-outline-primary"
                      disabled={paginaPagos <= 1}
                      onClick={() => void cambiarPaginaPagos(paginaPagos - 1)}
                    >
                      Anterior
                    </button>
                    <span>
                      Página {paginaPagos} de{" "}
                      {Math.max(1, Math.ceil(totalPagos / 20))}
                    </span>
                    <button
                      className="btn btn-outline-primary"
                      disabled={paginaPagos >= Math.ceil(totalPagos / 20)}
                      onClick={() => void cambiarPaginaPagos(paginaPagos + 1)}
                    >
                      Siguiente
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </section>
      )}
    </main>
  );
}
