import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import CambiarContrasenaPage from "./pages/CambiarContrasenaPage";
import DashboardPage from "./pages/DashboardPage";
import ClientesPage from "./pages/ClientesPage";
import PedidosPage from "./pages/PedidosPage";
import EntregasPage from "./pages/EntregasPage";
import NavegacionLateral from "./components/NavegacionLateral";
import LoginPage from "./pages/LoginPage";
import { cerrarSesion, obtenerUsuarioActual, type Usuario } from "./api/auth";
import { obtenerTokenRefresh, refrescarToken, sesionActiva } from "./api/http";
import { rolPermitidoEnFrontend } from "./api/roles";
import { registrarActividad } from "./auth/actividad";
import {
  detenerRastreoInactividad,
  iniciarRastreoInactividad,
} from "./auth/session";
import logoFranCosturas from "./assets/logo-fran-costuras.png";

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorSesion, setErrorSesion] = useState<string | null>(null);

  useEffect(() => {
    const actividad = () => registrarActividad();
    window.addEventListener("pointerdown", actividad);
    window.addEventListener("keydown", actividad);
    return () => {
      window.removeEventListener("pointerdown", actividad);
      window.removeEventListener("keydown", actividad);
    };
  }, []);

  useEffect(() => {
    let activo = true;
    const restaurarSesion = async () => {
      try {
        if (!obtenerTokenRefresh()) return;
        if (!sesionActiva()) await refrescarToken();
        const actual = await obtenerUsuarioActual();
        if (!actual.activo || !rolPermitidoEnFrontend(actual.rol)) {
          await cerrarSesion();
          return;
        }
        if (activo) setUsuario(actual);
      } catch (error) {
        const estado = (error as { response?: { status?: number } })?.response
          ?.status;
        if (estado === 401) await cerrarSesion();
        else
          setErrorSesion(
            "No se pudo conectar con el servidor. Intenta iniciar sesión de nuevo.",
          );
      } finally {
        if (activo) setCargando(false);
      }
    };
    void restaurarSesion();
    return () => {
      activo = false;
      detenerRastreoInactividad();
    };
  }, []);

  useEffect(() => {
    if (usuario) {
      iniciarRastreoInactividad(() => {
        setUsuario(null);
        setErrorSesion(null);
      });
    } else {
      detenerRastreoInactividad();
    }
  }, [usuario]);

  if (cargando) {
    return (
      <main className="container py-5" aria-live="polite">
        Cargando sesión…
      </main>
    );
  }
  if (errorSesion && !usuario) {
    return (
      <main className="container py-5" role="alert">
        <p>{errorSesion}</p>
        <button
          className="btn btn-primary"
          onClick={() => setErrorSesion(null)}
        >
          Ir al inicio de sesión
        </button>
      </main>
    );
  }

  const autenticado = usuario !== null;
  const requiereCambio = Boolean(usuario?.debe_cambiar_contraseña);
  const rutaInicio = requiereCambio ? "/cambiar-contraseña" : "/";

  const conBarraLateral = autenticado && !requiereCambio && usuario !== null;

  return (
    <div
      className={`fc-front-shell${conBarraLateral ? " fc-front-shell--lateral" : " d-flex flex-column"}`}
      style={{ minHeight: "100vh" }}
    >
      {conBarraLateral ? (
        <NavegacionLateral
          usuario={usuario}
          onCerrarSesion={() => {
            void cerrarSesion().finally(() => setUsuario(null));
          }}
        />
      ) : (
        <header className="container-fluid fc-front-navbar px-3 px-lg-5 py-3 d-flex flex-wrap align-items-center gap-3">
          <Link
            to={autenticado ? rutaInicio : "/login"}
            className="fc-front-brand me-auto"
          >
            <img
              src={logoFranCosturas}
              alt="Fran-Costuras — Diseña, Cose, Crea"
            />
          </Link>
        </header>
      )}
      <div className="fc-front-content">
        <Routes>
          <Route
            path="/login"
            element={
              autenticado ? (
                <Navigate to={rutaInicio} replace />
              ) : (
                <LoginPage onAutenticado={setUsuario} />
              )
            }
          />
          <Route
            path="/cambiar-contraseña"
            element={
              !autenticado ? (
                <Navigate to="/login" replace />
              ) : !requiereCambio ? (
                <Navigate to="/" replace />
              ) : (
                <CambiarContrasenaPage
                  onCambioCorrecto={() =>
                    setUsuario((actual) =>
                      actual
                        ? { ...actual, debe_cambiar_contraseña: false }
                        : actual,
                    )
                  }
                />
              )
            }
          />
          <Route
            path="/"
            element={
              !autenticado ? (
                <Navigate to="/login" replace />
              ) : requiereCambio ? (
                <Navigate to="/cambiar-contraseña" replace />
              ) : (
                <DashboardPage usuarioInicial={usuario} />
              )
            }
          />
          <Route
            path="/clientes"
            element={
              !autenticado ? (
                <Navigate to="/login" replace />
              ) : requiereCambio ? (
                <Navigate to="/cambiar-contraseña" replace />
              ) : usuario?.rol === "administradora" ||
                usuario?.rol === "recepcionista" ? (
                <ClientesPage />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/pedidos"
            element={
              !autenticado ? (
                <Navigate to="/login" replace />
              ) : requiereCambio ? (
                <Navigate to="/cambiar-contraseña" replace />
              ) : usuario ? (
                <PedidosPage usuario={usuario} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/entregas"
            element={
              !autenticado ? (
                <Navigate to="/login" replace />
              ) : requiereCambio ? (
                <Navigate to="/cambiar-contraseña" replace />
              ) : usuario?.rol === "administradora" ||
                usuario?.rol === "recepcionista" ? (
                <EntregasPage />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="*"
            element={
              <Navigate to={autenticado ? rutaInicio : "/login"} replace />
            }
          />
        </Routes>
      </div>
    </div>
  );
}
