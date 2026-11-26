import { useEffect, useState } from "react";
import { obtenerUsuarioActual, type Usuario } from "../api/auth";
import { extraerMensajeError } from "../api/errores";
import { Link } from "react-router-dom";
import Aviso from "../components/Aviso";
import EncabezadoPagina from "../components/EncabezadoPagina";
import IconoFC from "../components/IconoFC";
import ResumenRecepcion from "../components/ResumenRecepcion";

/**
 * Dashboard del cliente web (Frontend). Pantalla de bienvenida con datos del usuario.
 */
export default function DashboardPage({
  usuarioInicial = null,
}: {
  usuarioInicial?: Usuario | null;
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(usuarioInicial);
  const [cargando, setCargando] = useState(!usuarioInicial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (usuarioInicial) {
      setUsuario(usuarioInicial);
      setCargando(false);
      return;
    }
    let activo = true;
    obtenerUsuarioActual()
      .then((u) => {
        if (activo) {
          setUsuario(u);
          setCargando(false);
        }
      })
      .catch((e) => {
        if (activo) {
          setError(extraerMensajeError(e));
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, [usuarioInicial]);

  if (cargando) {
    return (
      <main
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "100vh" }}
      >
        <span
          className="spinner-border text-primary"
          aria-label="Cargando"
        ></span>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container py-5" style={{ color: "var(--fc-texto)" }}>
        <p>No se pudo cargar el dashboard: {error}</p>
      </main>
    );
  }

  const atiendeRecepcion =
    usuario?.rol === "administradora" || usuario?.rol === "recepcionista";

  return (
    <main className="fc-page fc-front-home">
      <EncabezadoPagina
        id="welcome-title"
        etiqueta="TU TALLER, MÁS ORGANIZADO"
        titulo={`Bienvenido${usuario?.nombre ? `, ${usuario.nombre}` : ""}`}
        descripcion={
          <>
            Pedidos, medidas y trabajo bien hecho, reunidos en un solo lugar.
            {usuario && (
              <span className="fc-front-session">Sesión: {usuario.email}</span>
            )}
          </>
        }
        acciones={
          atiendeRecepcion ? (
            <>
              <Link className="btn btn-outline-primary" to="/clientes">
                Clientes y medidas
              </Link>
              <Link className="btn btn-primary" to="/pedidos#registrar-pedido">
                Nuevo pedido
              </Link>
            </>
          ) : undefined
        }
      />

      <div className="fc-inicio">
        <div className="fc-inicio__principal">
          {atiendeRecepcion && <ResumenRecepcion />}
          <Aviso icono="aguja">
            Los detalles de cada pedido se mantienen actualizados para que el
            equipo trabaje con claridad.
          </Aviso>
        </div>

        <section
          className="fc-card fc-accesos"
          aria-label="Accesos principales"
        >
          <div className="fc-card__titulo">
            <IconoFC nombre="resumen" size={20} />
            <h2>Accesos rápidos</h2>
          </div>
          {atiendeRecepcion && (
            <Link className="fc-acceso" to="/clientes">
              <span className="fc-acceso__icono">
                <IconoFC nombre="equipo" size={20} />
              </span>
              <span>
                <strong>Clientes y medidas</strong>
                <small>Busca fichas y registra medidas del catálogo.</small>
              </span>
              <IconoFC nombre="flecha" size={16} />
            </Link>
          )}
          {usuario && (
            <Link className="fc-acceso" to="/pedidos">
              <span className="fc-acceso__icono">
                <IconoFC nombre="tijeras" size={20} />
              </span>
              <span>
                <strong>
                  {usuario.rol === "costurera" ? "Mis pedidos" : "Pedidos"}
                </strong>
                <small>
                  {usuario.rol === "costurera"
                    ? "Consulta tus asignaciones, fechas y detalles."
                    : "Registra pedidos y consulta su seguimiento."}
                </small>
              </span>
              <IconoFC nombre="flecha" size={16} />
            </Link>
          )}
          {atiendeRecepcion && (
            <>
              <Link className="fc-acceso" to="/entregas">
                <span className="fc-acceso__icono">
                  <IconoFC nombre="calendario" size={20} />
                </span>
                <span>
                  <strong>Entregas</strong>
                  <small>Pedidos terminados listos para retirar.</small>
                </span>
                <IconoFC nombre="flecha" size={16} />
              </Link>
              <Link className="fc-acceso" to="/pedidos#cobros">
                <span className="fc-acceso__icono">
                  <IconoFC nombre="pagos" size={20} />
                </span>
                <span>
                  <strong>Cobros y abonos</strong>
                  <small>Buscar pedido y saldo.</small>
                </span>
                <IconoFC nombre="flecha" size={16} />
              </Link>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
