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
import Aviso from "../components/Aviso";
import EncabezadoPagina from "../components/EncabezadoPagina";
import IconoFC from "../components/IconoFC";
import InsigniaEstado from "../components/InsigniaEstado";
import DialogoAvanceEstado from "../components/DialogoAvanceEstado";
import { ETIQUETA_SIGUIENTE_ESTADO } from "../components/estadosPedido";

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
  // Solo presentación del diseño «Frontend · Costurera»: diálogo de
  // confirmación y vista de toma de medidas dentro del detalle.
  const esCosturera = usuario.rol === "costurera";
  const [confirmando, setConfirmando] = useState(false);
  const [avanzando, setAvanzando] = useState(false);
  const [tomandoMedidas, setTomandoMedidas] = useState(false);

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
    setTomandoMedidas(false);
    setConfirmando(false);
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
    if (!seleccionado) return;
    if (esCosturera) {
      setConfirmando(true);
      return;
    }
    if (
      !window.confirm(
        `¿Confirmas avanzar ${seleccionado.codigo} al siguiente estado?`,
      )
    )
      return;
    await ejecutarAvance();
  }

  async function ejecutarAvance() {
    if (!seleccionado) return;
    setError(null);
    setMensaje(null);
    setAvanzando(true);
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
    } finally {
      setAvanzando(false);
      setConfirmando(false);
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

  // Solo presentación: lleva la vista al detalle cuando se abre un pedido.
  const codigoSeleccionado = seleccionado?.codigo;
  useEffect(() => {
    if (!codigoSeleccionado) return;
    document
      .getElementById("detalle-pedido")
      ?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [codigoSeleccionado]);

  if (cargando)
    return (
      <main className="fc-page" aria-live="polite">
        Cargando pedidos…
      </main>
    );

  const filtrosEstado = [
    { valor: "", texto: "Todos los activos" },
    { valor: "PENDIENTE", texto: "Pendiente" },
    { valor: "EN_PROCESO", texto: "En proceso" },
    { valor: "TERMINADO", texto: "Terminado" },
    ...(usuario.rol === "costurera"
      ? [{ valor: "ENTREGADO", texto: "Entregado" }]
      : []),
  ];

  // En el diseño de la costurera el detalle ocupa toda la pantalla.
  const vistaDetalleTaller = esCosturera && seleccionado !== null;
  const avisos = (
    <>
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
    </>
  );
  const siguienteEstado = seleccionado
    ? ETIQUETA_SIGUIENTE_ESTADO[seleccionado.estado]
    : undefined;

  return (
    <main className="fc-page">
      {!vistaDetalleTaller &&
        (esCosturera ? (
          <EncabezadoPagina
            etiqueta="MIS PEDIDOS"
            titulo="Mis pedidos asignados"
            descripcion="Solo ves los pedidos que la administradora te asignó, ordenados por fecha de entrega. Los entregados se consultan con el filtro «Entregado»."
          />
        ) : (
          <EncabezadoPagina
            etiqueta="PEDIDOS"
            titulo="Pedidos"
            descripcion="Ordenados por fecha de entrega. Los pedidos entregados salen del tablero; búscalos por código o por cliente."
            acciones={
              puedeRegistrar ? (
                <a className="btn btn-primary" href="#registrar-pedido">
                  Nuevo pedido
                </a>
              ) : undefined
            }
          />
        ))}
      {!vistaDetalleTaller && avisos}
      {puedeRegistrar && (
        <div className="fc-grid-2" id="registrar-pedido">
          <section
            className="fc-card"
            aria-labelledby="titulo-registrar-pedido"
          >
            <div className="fc-card__titulo">
              <IconoFC nombre="prenda" size={20} />
              <h2 id="titulo-registrar-pedido">Registrar pedido</h2>
            </div>
            <form className="fc-form" onSubmit={(e) => void guardar(e)}>
              <div>
                <label className="form-label" htmlFor="buscar-cliente-pedido">
                  Buscar cliente
                </label>
                <span className="fc-campo-icono">
                  <IconoFC nombre="buscar" size={18} />
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
                </span>
              </div>
              <div>
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
                <div className="fc-paginacion fc-paginacion--compacta">
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
              <div className="fc-form__fila">
                <div>
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
                <div>
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
              </div>
              <div>
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
              <Aviso tono="neutro">
                La fecha de entrega no puede ser anterior a hoy. Cliente, prenda
                y fecha son obligatorios.
              </Aviso>
              <div className="fc-form__acciones">
                <button className="btn btn-primary">Registrar pedido</button>
              </div>
            </form>
          </section>
          <div className="fc-columna-lateral">
            <Aviso>
              El código (FC-0000) y la fecha de creación se generan solos. Todo
              pedido empieza en «Pendiente».
            </Aviso>
            <Aviso>
              El total del pedido lo define la administradora con las tarifas
              del taller. Hasta entonces no se pueden registrar abonos.
            </Aviso>
          </div>
        </div>
      )}
      {!vistaDetalleTaller && (
        <section
          className={`fc-card${esCosturera ? " fc-card--plana" : ""}`}
          aria-labelledby="titulo-tablero"
        >
          <div
            className={`fc-card__titulo${esCosturera ? " visually-hidden" : ""}`}
          >
            <IconoFC nombre="tijeras" size={20} />
            <h2 id="titulo-tablero">Tablero de pedidos activos</h2>
            <span className="fc-card__meta">{totalPedidos} pedidos</span>
          </div>
          <div className="fc-filtros">
            <form
              className="fc-buscador"
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
              <span className="fc-campo-icono">
                <IconoFC nombre="buscar" size={18} />
                <input
                  id="buscar-pedido"
                  className="form-control"
                  placeholder="Código o nombre del cliente"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </span>
              <button className="btn btn-outline-primary">Buscar</button>
            </form>
            <div
              className="fc-chips"
              role="group"
              aria-label="Filtrar por estado"
            >
              {filtrosEstado.map((filtro) => (
                <button
                  type="button"
                  key={filtro.valor || "todos"}
                  className={`fc-chip${estadoFiltro === filtro.valor ? " is-active" : ""}`}
                  aria-pressed={estadoFiltro === filtro.valor}
                  onClick={() => {
                    setEstadoFiltro(filtro.valor);
                    void cargar(busqueda, 1, filtro.valor);
                  }}
                >
                  {filtro.texto}
                </button>
              ))}
            </div>
          </div>
          <div className="fc-tabla-card table-responsive">
            <table className="table fc-tabla mb-0">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Prenda</th>
                  <th>Entrega</th>
                  {!esCosturera && <th>Costurera</th>}
                  <th>Estado</th>
                  <th>
                    <span className="visually-hidden">Detalle</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((item) => (
                  <tr
                    key={item.id}
                    className={
                      seleccionado?.codigo === item.codigo ? "is-selected" : ""
                    }
                  >
                    <td className="fw-bold">{item.codigo}</td>
                    <td>{item.cliente_nombre}</td>
                    <td>{item.prenda_nombre}</td>
                    <td>
                      <span className="fc-fecha">
                        <IconoFC nombre="calendario" size={16} />
                        {item.fecha_entrega}
                      </span>
                    </td>
                    {!esCosturera && (
                      <td className="fc-texto-suave">
                        {item.costurera_nombre ?? "Sin asignar"}
                      </td>
                    )}
                    <td>
                      <InsigniaEstado estado={item.estado} />
                    </td>
                    <td>
                      <button
                        className="fc-chip-accion"
                        onClick={() => void verDetalle(item.codigo)}
                      >
                        <IconoFC nombre="flecha" size={14} />
                        Detalle
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
          {pedidos.length === 0 && (
            <p className="fc-vacio">No hay pedidos activos para mostrar.</p>
          )}
        </section>
      )}
      {esCosturera && !vistaDetalleTaller && (
        <Aviso>
          Solo aparecen tus pedidos. Si abres el enlace de un pedido de otra
          costurera, la API responde «Sin permiso» (403). Para cambiar una fecha
          de entrega, avisa a la administradora.
        </Aviso>
      )}
      {seleccionado && (
        <section
          className="fc-detalle"
          id="detalle-pedido"
          aria-labelledby="titulo-detalle"
        >
          <div className="fc-detalle__cabecera">
            <div>
              {esCosturera ? (
                <p className="fc-eyebrow">
                  MIS PEDIDOS › {seleccionado.codigo}
                  {tomandoMedidas && " › MEDIDAS"}
                </p>
              ) : (
                <p className="fc-eyebrow">PEDIDOS · {seleccionado.codigo}</p>
              )}
              <h2 id="titulo-detalle">
                {tomandoMedidas
                  ? "Registrar toma de medidas"
                  : `${seleccionado.codigo} · ${seleccionado.prenda_nombre}`}
              </h2>
              {esCosturera && (
                <p className="fc-detalle__sub">
                  {tomandoMedidas
                    ? `${seleccionado.codigo} · ${seleccionado.prenda_nombre} · ${seleccionado.cliente_nombre}`
                    : `${seleccionado.cliente_nombre} · entrega prevista el ${seleccionado.fecha_entrega}`}
                </p>
              )}
            </div>
            <InsigniaEstado estado={seleccionado.estado} />
            {(usuario.rol === "administradora" ||
              usuario.rol === "costurera") &&
              seleccionado.estado !== "ENTREGADO" &&
              !tomandoMedidas && (
                <button
                  className="btn btn-primary"
                  onClick={() => void avanzarEstado()}
                >
                  {esCosturera && siguienteEstado
                    ? `Pasar a «${siguienteEstado}»`
                    : "Confirmar siguiente estado"}
                </button>
              )}
            {tomandoMedidas ? (
              <button
                className="btn btn-outline-primary"
                onClick={() => setTomandoMedidas(false)}
              >
                Volver al pedido
              </button>
            ) : (
              <button
                className="btn btn-outline-primary"
                onClick={() => setSeleccionado(null)}
              >
                Cerrar
              </button>
            )}
          </div>
          {vistaDetalleTaller && avisos}
          {tomandoMedidas ? (
            <TomaMedidasPedido
              pedido={seleccionado}
              onVolver={() => setTomandoMedidas(false)}
            />
          ) : (
            <div className="fc-grid-2">
              <div className="fc-columna">
                <section className="fc-card" aria-label="Datos del pedido">
                  <div className="fc-card__titulo">
                    <IconoFC nombre="prenda" size={20} />
                    <h3>Datos del pedido</h3>
                  </div>
                  {esCosturera ? (
                    <dl className="fc-datos">
                      <div>
                        <dt>Cliente</dt>
                        <dd>{seleccionado.cliente_nombre}</dd>
                      </div>
                      <div>
                        <dt>Prenda · categoría</dt>
                        <dd>
                          {seleccionado.prenda_nombre} ·{" "}
                          {seleccionado.categoria_codigo}
                        </dd>
                      </div>
                      <div>
                        <dt>Entrega</dt>
                        <dd>{seleccionado.fecha_entrega}</dd>
                      </div>
                    </dl>
                  ) : (
                    <dl className="fc-datos">
                      <div>
                        <dt>Cliente</dt>
                        <dd>{seleccionado.cliente_nombre}</dd>
                      </div>
                      <div>
                        <dt>Costurera</dt>
                        <dd>
                          {seleccionado.costurera_nombre ?? "Sin asignar"}
                        </dd>
                      </div>
                      <div>
                        <dt>Entrega</dt>
                        <dd>{seleccionado.fecha_entrega}</dd>
                      </div>
                      <div>
                        <dt>Estado</dt>
                        <dd>{seleccionado.estado}</dd>
                      </div>
                    </dl>
                  )}
                  {seleccionado.descripcion && (
                    <dl className="fc-datos">
                      <div className="fc-datos__ancho">
                        <dt>Descripción</dt>
                        <dd>{seleccionado.descripcion}</dd>
                      </div>
                    </dl>
                  )}
                  <h4 className="fc-subtitulo">Últimas medidas registradas</h4>
                  {seleccionado.medidas_ultima_toma ? (
                    <>
                      <p className="fc-ayuda">
                        {seleccionado.medidas_ultima_toma.categoria} ·{" "}
                        {new Date(
                          seleccionado.medidas_ultima_toma.fecha,
                        ).toLocaleDateString("es-EC")}
                      </p>
                      <ul className="fc-pildoras">
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
                </section>
                <GestionConsumosPedido
                  pedido={seleccionado}
                  puedeRegistrar={puedeRegistrar}
                />
                <section className="fc-card" aria-label="Notas internas">
                  <form onSubmit={(e) => void guardarNota(e)}>
                    <div className="fc-card__titulo">
                      <IconoFC nombre="editar" size={20} />
                      <label className="h3 mb-0" htmlFor="nota-interna">
                        Nota interna (visible para el personal del taller)
                      </label>
                    </div>
                    <textarea
                      id="nota-interna"
                      className="form-control mb-2"
                      rows={3}
                      value={notaInterna}
                      onChange={(e) => setNotaInterna(e.target.value)}
                    />
                    <div className="fc-form__acciones">
                      <button className="btn btn-outline-primary">
                        Guardar nota
                      </button>
                    </div>
                  </form>
                </section>
              </div>
              <div className="fc-columna">
                <section className="fc-card" aria-label="Historial de estados">
                  <div className="fc-card__titulo">
                    <IconoFC nombre="reloj" size={20} />
                    <h3>Historial de estados</h3>
                  </div>
                  {historial.length === 0 ? (
                    <p className="fc-ayuda">Sin cambios de estado todavía.</p>
                  ) : (
                    <ol className="fc-linea-tiempo">
                      {historial.map((cambio) => (
                        <li key={cambio.id}>
                          <strong>
                            {cambio.estado_anterior.replace(/_/g, " ")} →{" "}
                            {cambio.estado_nuevo.replace(/_/g, " ")}
                          </strong>
                          <small>
                            {new Date(cambio.fecha_hora).toLocaleString(
                              "es-EC",
                            )}{" "}
                            · {cambio.usuario_nombre}
                          </small>
                        </li>
                      ))}
                    </ol>
                  )}
                  <p className="fc-ayuda mb-0">
                    Solo se avanza en orden: Pendiente → En proceso → Terminado
                    → Entregado. Cada cambio pide confirmación.
                  </p>
                </section>
                {esCosturera && (
                  <section className="fc-card" aria-label="Medidas del pedido">
                    <div className="fc-card__titulo">
                      <IconoFC nombre="aguja" size={20} />
                      <h3>Medidas del pedido</h3>
                    </div>
                    <p className="fc-ayuda">
                      ¿La clienta vino a una prueba? Registra una toma nueva en
                      centímetros. No se sobrescribe la anterior: queda en el
                      historial.
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      onClick={() => setTomandoMedidas(true)}
                    >
                      Registrar nueva toma
                    </button>
                  </section>
                )}
                {puedeRegistrar && (
                  <section className="fc-card" aria-label="Pagos y saldo">
                    <div className="fc-card__titulo">
                      <IconoFC nombre="pagos" size={20} />
                      <h3>Pagos y saldo</h3>
                    </div>
                    <div className="fc-saldos">
                      <div className="fc-saldo">
                        <small>Total del pedido</small>
                        <strong>
                          ${Number(seleccionado.total).toFixed(2)}
                        </strong>
                      </div>
                      <div className="fc-saldo fc-saldo--pendiente">
                        <small>Saldo pendiente</small>
                        <strong>${Number(saldo).toFixed(2)}</strong>
                      </div>
                    </div>
                    {seleccionado.estado === "TERMINADO" &&
                      Number(saldo) > 0 && (
                        <Aviso tono="error">
                          Este pedido tiene saldo pendiente de $
                          {Number(saldo).toFixed(2)}. Registra el abono antes de
                          entregarlo.
                        </Aviso>
                      )}
                    {Number(seleccionado.total) > 0 && Number(saldo) > 0 ? (
                      <form
                        className="fc-form"
                        onSubmit={(e) => void guardarPago(e)}
                      >
                        <div>
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
                        <button
                          className="btn btn-primary w-100"
                          disabled={guardandoPago}
                        >
                          {guardandoPago ? "Guardando…" : "Registrar abono"}
                        </button>
                      </form>
                    ) : (
                      <p className="fc-ayuda">
                        {Number(seleccionado.total) <= 0
                          ? "El total del pedido aún no está definido."
                          : "El pedido no tiene saldo pendiente."}
                      </p>
                    )}
                    {pagos.length === 0 ? (
                      <p className="fc-ayuda">No hay abonos registrados.</p>
                    ) : (
                      <>
                        <ul className="fc-abonos">
                          {pagos.map((pago) => (
                            <li key={pago.id}>
                              <span>
                                <strong
                                  className={pago.anulado ? "fc-anulado" : ""}
                                >
                                  ${Number(pago.monto).toFixed(2)}
                                </strong>
                                <small>
                                  {new Date(pago.fecha).toLocaleString("es-EC")}{" "}
                                  · {pago.registrado_por_nombre}
                                </small>
                              </span>
                              {pago.anulado && (
                                <span className="fc-badge fc-badge--anulado">
                                  Anulado
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <div className="fc-paginacion">
                          <button
                            className="btn btn-outline-primary"
                            disabled={paginaPagos <= 1}
                            onClick={() =>
                              void cambiarPaginaPagos(paginaPagos - 1)
                            }
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
                            onClick={() =>
                              void cambiarPaginaPagos(paginaPagos + 1)
                            }
                          >
                            Siguiente
                          </button>
                        </div>
                      </>
                    )}
                  </section>
                )}
              </div>
            </div>
          )}
        </section>
      )}
      {confirmando && seleccionado && (
        <DialogoAvanceEstado
          pedido={seleccionado}
          enviando={avanzando}
          onConfirmar={() => void ejecutarAvance()}
          onCancelar={() => setConfirmando(false)}
        />
      )}
      {puedeRegistrar && (
        <section
          className="fc-card"
          id="cobros"
          aria-labelledby="titulo-cobros"
        >
          <div className="fc-card__titulo">
            <IconoFC nombre="pagos" size={20} />
            <h2 id="titulo-cobros">Consultar pedidos y saldos</h2>
          </div>
          <p className="fc-ayuda">
            Busca también pedidos entregados para revisar sus pagos y saldo.
          </p>
          <form
            className="fc-buscador"
            onSubmit={(e) => void buscarPedidosPago(e)}
          >
            <label className="visually-hidden" htmlFor="buscar-pedido-pago">
              Código o nombre del cliente para consultar pagos
            </label>
            <span className="fc-campo-icono">
              <IconoFC nombre="buscar" size={18} />
              <input
                id="buscar-pedido-pago"
                className="form-control"
                placeholder="Código o nombre del cliente"
                value={busquedaPago}
                onChange={(e) => setBusquedaPago(e.target.value)}
              />
            </span>
            <button
              className="btn btn-outline-primary"
              disabled={cargandoPedidosPago}
            >
              {cargandoPedidosPago ? "Buscando…" : "Buscar pedidos"}
            </button>
          </form>
          {pedidosPago.length > 0 && (
            <>
              <div className="fc-tabla-card table-responsive">
                <table className="table fc-tabla mb-0">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>Entrega</th>
                      <th>Estado</th>
                      <th>Total</th>
                      <th>
                        <span className="visually-hidden">Acción</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosPago.map((pedido) => (
                      <tr key={pedido.id}>
                        <td className="fw-bold">{pedido.codigo}</td>
                        <td>{pedido.cliente_nombre}</td>
                        <td>{pedido.fecha_entrega}</td>
                        <td>
                          <InsigniaEstado estado={pedido.estado} />
                        </td>
                        <td>${Number(pedido.total).toFixed(2)}</td>
                        <td>
                          <button
                            className="fc-chip-accion"
                            onClick={() => void verDetalle(pedido.codigo)}
                          >
                            <IconoFC nombre="pagos" size={14} />
                            Ver pagos y saldo
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
    </main>
  );
}
