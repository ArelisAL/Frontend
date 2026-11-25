import { useEffect, useState } from "react";
import { obtenerUsuarioActual, type Usuario } from "../api/auth";
import { extraerMensajeError } from "../api/errores";
import { Link } from "react-router-dom";

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

  return (
    <main className="container py-4 fc-front-home">
      <section className="fc-front-welcome" aria-labelledby="welcome-title">
        <div>
          <span className="fc-front-eyebrow">TU TALLER, MÁS ORGANIZADO</span>
          <h1 id="welcome-title">
            Bienvenido{usuario?.nombre ? `, ${usuario.nombre}` : ""}
          </h1>
          <p>
            Pedidos, medidas y trabajo bien hecho, reunidos en un solo lugar.
          </p>
          {usuario && (
            <span className="fc-front-session">Sesión: {usuario.email}</span>
          )}
        </div>
        <span className="fc-front-welcome__art" aria-hidden="true">
          ✂︎
        </span>
      </section>

      <section className="fc-front-actions" aria-label="Accesos principales">
        {(usuario?.rol === "administradora" ||
          usuario?.rol === "recepcionista") && (
          <Link className="fc-front-action" to="/clientes">
            <span className="fc-front-action__icon">◎</span>
            <span>
              <strong>Clientes y medidas</strong>
              <small>Busca fichas y registra medidas del catálogo.</small>
            </span>
            <span className="fc-front-action__arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        )}
        {usuario && (
          <Link className="fc-front-action" to="/pedidos">
            <span className="fc-front-action__icon fc-front-action__icon--pink">
              ✂︎
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
            <span className="fc-front-action__arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        )}
      </section>

      <div className="fc-front-note">
        <span aria-hidden="true">✧</span>
        <p>
          Los detalles de cada pedido se mantienen actualizados para que el
          equipo trabaje con claridad.
        </p>
      </div>
    </main>
  );
}
