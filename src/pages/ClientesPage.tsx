import { useEffect, useMemo, useState } from "react";
import {
  crearCliente,
  listarCategorias,
  listarClientes,
  listarMedidasCliente,
  listarMedidasPrenda,
  listarPrendas,
  registrarMedida,
  type Categoria,
  type Cliente,
  type Medida,
  type Prenda,
  type PrendaMedida,
} from "../api/clientes";
import { extraerMensajeError } from "../api/errores";
import Aviso from "../components/Aviso";
import EncabezadoPagina from "../components/EncabezadoPagina";
import IconoFC from "../components/IconoFC";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [paginaClientes, setPaginaClientes] = useState(1);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [requisitos, setRequisitos] = useState<PrendaMedida[]>([]);
  const [historial, setHistorial] = useState<Medida[]>([]);
  const [paginaHistorial, setPaginaHistorial] = useState(1);
  const [totalMedidas, setTotalMedidas] = useState(0);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [categoria, setCategoria] = useState("");
  const [prenda, setPrenda] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [valores, setValores] = useState<Record<string, string>>({});
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const categoriaActual = categorias.find((item) => item.codigo === categoria);
  const campos = useMemo(
    () =>
      categoria === "BEBE" ? (categoriaActual?.tipos_medida ?? []) : requisitos,
    [categoria, categoriaActual, requisitos],
  );

  async function cargarClientes(texto = busqueda, numeroPagina = 1) {
    const pagina = await listarClientes(texto, numeroPagina);
    setClientes(pagina.results);
    setTotalClientes(pagina.count);
    setPaginaClientes(numeroPagina);
  }

  useEffect(() => {
    Promise.all([listarClientes(), listarCategorias()])
      .then(([lista, catalogo]) => {
        setClientes(lista.results);
        setTotalClientes(lista.count);
        setCategorias(catalogo.results);
        setCargando(false);
      })
      .catch((e: unknown) => {
        setError(extraerMensajeError(e));
        setCargando(false);
      });
  }, []);

  useEffect(() => {
    setPrendas([]);
    setPrenda("");
    setRequisitos([]);
    setValores({});
    if (!categoria || categoria === "BEBE") return;
    listarPrendas(categoria)
      .then((pagina) => setPrendas(pagina.results))
      .catch((e: unknown) => setError(extraerMensajeError(e)));
  }, [categoria]);

  useEffect(() => {
    setRequisitos([]);
    setValores({});
    if (!prenda) return;
    listarMedidasPrenda(Number(prenda))
      .then((pagina) => setRequisitos(pagina.results))
      .catch((e: unknown) => setError(extraerMensajeError(e)));
  }, [prenda]);

  async function seleccionarCliente(id: number, pagina = 1) {
    setSeleccionado(id);
    setError(null);
    try {
      const resultado = await listarMedidasCliente(id, pagina);
      setHistorial(resultado.results);
      setTotalMedidas(resultado.count);
      setPaginaHistorial(pagina);
    } catch (e) {
      setError(extraerMensajeError(e));
    }
  }

  async function guardarCliente(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    try {
      const creado = await crearCliente({ nombre, telefono, correo });
      setClientes((actuales) => [creado, ...actuales]);
      setNombre("");
      setTelefono("");
      setCorreo("");
      setMensaje("Cliente registrado.");
    } catch (e) {
      setError(extraerMensajeError(e));
    }
  }

  async function guardarMedida(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!seleccionado) return;
    setError(null);
    setMensaje(null);
    const incompletos = campos.filter(
      (campo) =>
        !("opcional" in campo && campo.opcional) &&
        !valores[campo.codigo]?.trim(),
    );
    if (incompletos.length) {
      setError("Completa todas las medidas obligatorias.");
      return;
    }
    try {
      const payload: Record<string, number> = {};
      campos.forEach((campo) => {
        const valor = valores[campo.codigo]?.trim();
        if (valor) payload[campo.codigo] = Number(valor);
      });
      await registrarMedida(seleccionado, {
        categoria,
        prenda: prenda ? Number(prenda) : null,
        valores_cm: payload,
      });
      await seleccionarCliente(seleccionado);
      setValores({});
      setMensaje("Toma de medidas guardada en el historial.");
    } catch (e) {
      setError(extraerMensajeError(e));
    }
  }

  if (cargando)
    return (
      <main className="fc-page" aria-live="polite">
        Cargando clientes y catálogo…
      </main>
    );

  const paginasClientes = Math.max(1, Math.ceil(totalClientes / 20));
  const paginasHistorial = Math.max(1, Math.ceil(totalMedidas / 20));
  const clienteActual = clientes.find((item) => item.id === seleccionado);

  return (
    <main className="fc-page">
      <EncabezadoPagina
        etiqueta="CLIENTES Y MEDIDAS"
        titulo="Clientes y medidas"
        descripcion="Registra clientes nuevos y búscalos por nombre, teléfono o correo. El teléfono y el correo no se pueden repetir."
      />
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
      <div className="fc-grid-2">
        <section className="fc-card" aria-labelledby="titulo-buscar-clientes">
          <div className="fc-card__titulo">
            <IconoFC nombre="buscar" size={20} />
            <h2 id="titulo-buscar-clientes">Buscar clientes</h2>
            <span className="fc-card__meta">{totalClientes} clientes</span>
          </div>
          <form
            className="fc-buscador"
            onSubmit={(e) => {
              e.preventDefault();
              void cargarClientes(busqueda).catch((x: unknown) =>
                setError(extraerMensajeError(x)),
              );
            }}
          >
            <label htmlFor="buscar" className="visually-hidden">
              Nombre, teléfono o correo
            </label>
            <span className="fc-campo-icono">
              <IconoFC nombre="buscar" size={18} />
              <input
                id="buscar"
                className="form-control"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, teléfono o correo"
              />
            </span>
            <button className="btn btn-outline-primary">Buscar</button>
          </form>
          <div className="fc-tabla-card table-responsive">
            <table className="table fc-tabla mb-0">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className={seleccionado === cliente.id ? "is-selected" : ""}
                  >
                    <td>
                      <strong className="d-block">{cliente.nombre}</strong>
                      <small>{cliente.correo}</small>
                    </td>
                    <td>{cliente.telefono}</td>
                    <td>
                      <button
                        type="button"
                        className="fc-chip-accion"
                        aria-pressed={seleccionado === cliente.id}
                        title={`${cliente.nombre} · ${cliente.telefono || cliente.correo}`}
                        onClick={() => void seleccionarCliente(cliente.id)}
                      >
                        <IconoFC nombre="aguja" size={14} />
                        Ver medidas
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
              disabled={paginaClientes <= 1}
              onClick={() => void cargarClientes(busqueda, paginaClientes - 1)}
            >
              Anterior
            </button>
            <span>
              Página {paginaClientes} de {paginasClientes}
            </span>
            <button
              className="btn btn-outline-primary"
              disabled={paginaClientes >= Math.ceil(totalClientes / 20)}
              onClick={() => void cargarClientes(busqueda, paginaClientes + 1)}
            >
              Siguiente
            </button>
          </div>
        </section>
        <section
          className="fc-card fc-card--lateral"
          id="registrar-cliente"
          aria-labelledby="titulo-registrar-cliente"
        >
          <div className="fc-card__titulo">
            <IconoFC nombre="equipo" size={20} />
            <h2 id="titulo-registrar-cliente">Registrar cliente</h2>
          </div>
          <p className="fc-ayuda">
            Solo pedimos los datos necesarios. El teléfono y el correo no se
            pueden repetir.
          </p>
          <form onSubmit={(e) => void guardarCliente(e)} className="fc-form">
            <div>
              <label className="form-label" htmlFor="nombre">
                Nombre
              </label>
              <input
                id="nombre"
                className="form-control"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                maxLength={200}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="telefono">
                Teléfono
              </label>
              <input
                id="telefono"
                className="form-control"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="correo">
                Correo
              </label>
              <input
                id="correo"
                type="email"
                className="form-control"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>
            <button className="btn btn-primary w-100">Guardar cliente</button>
          </form>
        </section>
      </div>
      {seleccionado && (
        <div className="fc-grid-2" id="ficha-cliente">
          <section className="fc-card" aria-labelledby="titulo-toma">
            <div className="fc-card__titulo">
              <IconoFC nombre="aguja" size={20} />
              <h2 id="titulo-toma">Nueva toma de medidas</h2>
              {clienteActual && (
                <span className="fc-card__meta">{clienteActual.nombre}</span>
              )}
            </div>
            <form onSubmit={(e) => void guardarMedida(e)} className="fc-form">
              <div className="fc-form__fila">
                <div>
                  <label className="form-label" htmlFor="categoria">
                    Categoría
                  </label>
                  <select
                    id="categoria"
                    className="form-select"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias.map((item) => (
                      <option value={item.codigo} key={item.id}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                {categoria && categoria !== "BEBE" && (
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
                )}
              </div>
              {campos.length > 0 && (
                <Aviso tono="neutro">
                  Se muestran solo las medidas de la prenda elegida. Mide el
                  cuerpo (no la prenda), en centímetros, con hasta un decimal y
                  siempre mayor que 0.
                </Aviso>
              )}
              <div className="fc-medidas">
                {campos.map((campo) => (
                  <div className="fc-medida" key={campo.codigo}>
                    <div className="fc-medida__texto">
                      <label className="form-label" htmlFor={campo.codigo}>
                        {campo.nombre}
                        {"opcional" in campo && campo.opcional
                          ? " (opcional)"
                          : ""}{" "}
                        (cm)
                      </label>
                      <div className="form-text" id={`${campo.codigo}-ayuda`}>
                        {campo.como_se_toma}
                      </div>
                    </div>
                    <span className="fc-medida__campo">
                      <input
                        id={campo.codigo}
                        type="number"
                        min="0.1"
                        step="0.1"
                        inputMode="decimal"
                        className="form-control"
                        value={valores[campo.codigo] ?? ""}
                        onChange={(e) =>
                          setValores((actuales) => ({
                            ...actuales,
                            [campo.codigo]: e.target.value,
                          }))
                        }
                        aria-describedby={`${campo.codigo}-ayuda`}
                      />
                      <span aria-hidden="true">cm</span>
                    </span>
                  </div>
                ))}
              </div>
              {categoria && (categoria === "BEBE" || prenda) && (
                <div className="fc-form__acciones">
                  <button className="btn btn-primary">Guardar toma</button>
                </div>
              )}
            </form>
          </section>
          <section
            className="fc-card fc-card--lateral"
            aria-labelledby="titulo-historial-medidas"
          >
            <div className="fc-card__titulo">
              <IconoFC nombre="reloj" size={20} />
              <h2 id="titulo-historial-medidas">Historial de medidas</h2>
              <span className="fc-card__meta">{totalMedidas} tomas</span>
            </div>
            <p className="fc-ayuda">
              Cada toma se guarda como un registro nuevo; las anteriores no se
              sobrescriben.
            </p>
            {historial.length === 0 ? (
              <p>No hay tomas registradas.</p>
            ) : (
              <>
                {historial.map((toma, indice) => (
                  <article
                    className={`fc-toma${indice === 0 ? " fc-toma--reciente" : ""}`}
                    key={toma.id}
                  >
                    <div className="fc-toma__cabecera">
                      <strong>
                        {toma.categoria} · {toma.prenda ?? "Bebé"}
                      </strong>
                      <span>
                        {new Date(toma.fecha).toLocaleDateString("es-EC")}
                      </span>
                    </div>
                    <ul>
                      {Object.entries(toma.valores_cm).map(
                        ([codigo, valor]) => (
                          <li key={codigo}>
                            {codigo}: {valor} cm
                          </li>
                        ),
                      )}
                    </ul>
                  </article>
                ))}
                <div className="fc-paginacion">
                  <button
                    className="btn btn-outline-primary"
                    disabled={paginaHistorial <= 1}
                    onClick={() =>
                      void seleccionarCliente(seleccionado, paginaHistorial - 1)
                    }
                  >
                    Anterior
                  </button>
                  <span>
                    Página {paginaHistorial} de {paginasHistorial}
                  </span>
                  <button
                    className="btn btn-outline-primary"
                    disabled={paginaHistorial >= Math.ceil(totalMedidas / 20)}
                    onClick={() =>
                      void seleccionarCliente(seleccionado, paginaHistorial + 1)
                    }
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
