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
      <main className="container py-5" aria-live="polite">
        Cargando clientes y catálogo…
      </main>
    );
  return (
    <main className="container py-4" style={{ color: "var(--fc-texto)" }}>
      <h1 style={{ color: "var(--fc-titulo)" }}>Clientes y medidas</h1>
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
      <section className="card p-3 mb-4">
        <h2 className="h4">Registrar cliente</h2>
        <form onSubmit={(e) => void guardarCliente(e)} className="row g-3">
          <div className="col-12 col-md-4">
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
          <div className="col-12 col-md-4">
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
          <div className="col-12 col-md-4">
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
          <div className="col-12">
            <button className="btn btn-primary">Guardar cliente</button>
          </div>
        </form>
      </section>
      <section className="card p-3 mb-4">
        <h2 className="h4">Buscar clientes</h2>
        <form
          className="d-flex flex-column flex-sm-row gap-2"
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
          <input
            id="buscar"
            className="form-control"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre, teléfono o correo"
          />
          <button className="btn btn-outline-primary">Buscar</button>
        </form>
        <div className="list-group mt-3">
          {clientes.map((cliente) => (
            <button
              key={cliente.id}
              className={`list-group-item list-group-item-action ${seleccionado === cliente.id ? "active" : ""}`}
              onClick={() => void seleccionarCliente(cliente.id)}
            >
              {cliente.nombre} · {cliente.telefono || cliente.correo}
            </button>
          ))}
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            className="btn btn-outline-primary"
            disabled={paginaClientes <= 1}
            onClick={() => void cargarClientes(busqueda, paginaClientes - 1)}
          >
            Anterior
          </button>
          <span>
            Página {paginaClientes} de{" "}
            {Math.max(1, Math.ceil(totalClientes / 20))}
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
      {seleccionado && (
        <section className="card p-3">
          <h2 className="h4">Nueva toma de medidas</h2>
          <form onSubmit={(e) => void guardarMedida(e)} className="row g-3">
            <div className="col-12 col-md-6">
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
            )}
            {campos.map((campo) => (
              <div className="col-12 col-md-6" key={campo.codigo}>
                <label className="form-label" htmlFor={campo.codigo}>
                  {campo.nombre}
                  {"opcional" in campo && campo.opcional
                    ? " (opcional)"
                    : ""}{" "}
                  (cm)
                </label>
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
                <div className="form-text" id={`${campo.codigo}-ayuda`}>
                  {campo.como_se_toma}
                </div>
              </div>
            ))}
            {categoria && (categoria === "BEBE" || prenda) && (
              <div className="col-12">
                <button className="btn btn-primary">Guardar toma</button>
              </div>
            )}
          </form>
          <h2 className="h4 mt-4">Historial de medidas</h2>
          {historial.length === 0 ? (
            <p>No hay tomas registradas.</p>
          ) : (
            <>
              {historial.map((toma) => (
                <article className="border rounded p-3 mb-2" key={toma.id}>
                  <strong>
                    {toma.categoria} · {toma.prenda ?? "Bebé"}
                  </strong>
                  <div>{new Date(toma.fecha).toLocaleDateString("es-EC")}</div>
                  <ul>
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
                  className="btn btn-outline-primary"
                  disabled={paginaHistorial <= 1}
                  onClick={() =>
                    void seleccionarCliente(seleccionado, paginaHistorial - 1)
                  }
                >
                  Anterior
                </button>
                <span>
                  Página {paginaHistorial} de{" "}
                  {Math.max(1, Math.ceil(totalMedidas / 20))}
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
      )}
    </main>
  );
}
