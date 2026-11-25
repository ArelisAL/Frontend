import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {
  cerrarSesion,
  login,
  loginConGoogle,
  obtenerUsuarioActual,
  type Usuario,
} from "../api/auth";
import type { Rol } from "../api/roles";
import { extraerMensajeError } from "../api/errores";
import { sesionActiva } from "../api/http";
import logo from "../assets/logo-fran-costuras.png";

const roles: { valor: Rol; nombre: string; detalle: string }[] = [
  {
    valor: "administradora",
    nombre: "Administración",
    detalle: "Gestión del taller",
  },
  {
    valor: "recepcionista",
    nombre: "Recepción",
    detalle: "Clientes y pedidos",
  },
  { valor: "costurera", nombre: "Costura", detalle: "Mis pedidos asignados" },
];

function Icono({ tipo }: { tipo: "correo" | "clave" | "rol" }) {
  const paths = {
    correo: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    clave: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
      </>
    ),
    rol: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[tipo]}
    </svg>
  );
}

export default function LoginPage({
  onAutenticado,
}: {
  onAutenticado?: (usuario: Usuario) => void;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("recepcionista");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const anchoGoogle = Math.min(360, Math.max(240, window.innerWidth - 84));

  async function completarAcceso(iniciar: () => Promise<unknown>) {
    setCargando(true);
    setError(null);
    try {
      await iniciar();
      const usuario = await obtenerUsuarioActual();
      if (!usuario.activo || usuario.rol !== rol) {
        await cerrarSesion();
        throw new Error(
          "El perfil elegido no coincide con tu cuenta. Selecciona tu perfil e inténtalo de nuevo.",
        );
      }
      onAutenticado?.(usuario);
      navigate(usuario.debe_cambiar_contraseña ? "/cambiar-contraseña" : "/", {
        replace: true,
      });
    } catch (e) {
      setError(extraerMensajeError(e));
    } finally {
      setCargando(false);
    }
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    return completarAcceso(() => login({ email, password }));
  }

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Bienvenida a Fran-Costuras">
        <div className="auth-story-mark">
          <span aria-hidden="true">✦</span> TALLER DE CONFECCIÓN
        </div>
        <h1>
          Diseña. Cose.
          <br />
          <span>Crea.</span>
        </h1>
        <p>
          Un espacio hecho para que cada pedido, cada detalle y cada puntada
          tengan su lugar.
        </p>
        <div className="auth-story-points">
          <div>
            <span className="auth-point-icon" aria-hidden="true">
              ✧
            </span>
            <span>
              <strong>Todo en orden</strong>
              <small>Clientes, medidas y pedidos en un solo lugar.</small>
            </span>
          </div>
          <div>
            <span className="auth-point-icon" aria-hidden="true">
              ⌁
            </span>
            <span>
              <strong>Tu trabajo, a tu ritmo</strong>
              <small>Entra al espacio que corresponde a tu perfil.</small>
            </span>
          </div>
        </div>
        <div className="auth-stitch" aria-hidden="true" />
      </section>

      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-logo-wrap">
          <img src={logo} alt="Fran-Costuras — Diseña, Cose, Crea" />
        </div>
        <div className="auth-eyebrow">QUÉ BUENO TENERTE DE VUELTA</div>
        <h2 id="login-title">Iniciar sesión</h2>
        <p className="auth-subtitle">Ingresa a tu espacio de trabajo</p>
        {error && (
          <div className="auth-error" role="alert">
            <span aria-hidden="true">!</span>
            {error}
          </div>
        )}

        <form onSubmit={enviar} className="auth-form">
          <label htmlFor="perfil">¿Cómo ingresas?</label>
          <div className="auth-control auth-select-wrap">
            <span className="auth-control-icon">
              <Icono tipo="rol" />
            </span>
            <select
              id="perfil"
              name="rol"
              value={rol}
              onChange={(e) => setRol(e.target.value as Rol)}
              disabled={cargando}
            >
              {roles.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.nombre} · {opcion.detalle}
                </option>
              ))}
            </select>
            <span className="auth-select-chevron" aria-hidden="true">
              ⌄
            </span>
          </div>

          <label htmlFor="email">Correo electrónico</label>
          <div className="auth-control">
            <span className="auth-control-icon">
              <Icono tipo="correo" />
            </span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="nombre@ejemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={cargando}
            />
          </div>

          <label htmlFor="password">Contraseña</label>
          <div className="auth-control">
            <span className="auth-control-icon">
              <Icono tipo="clave" />
            </span>
            <input
              id="password"
              name="password"
              type={mostrarClave ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Escribe tu contraseña"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={cargando}
            />
            <button
              type="button"
              className="auth-toggle"
              onClick={() => setMostrarClave((actual) => !actual)}
              aria-label={
                mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={mostrarClave}
              disabled={cargando}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>

          <button type="submit" className="auth-submit" disabled={cargando}>
            {cargando ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                Verificando acceso…
              </>
            ) : (
              <>
                Entrar a mi espacio <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <>
            <div className="auth-divider">
              <span>o continúa con</span>
            </div>
            <div className="auth-google">
              <GoogleLogin
                onSuccess={({ credential }) =>
                  credential
                    ? void completarAcceso(() => loginConGoogle(credential))
                    : setError("Google no devolvió una credencial válida.")
                }
                onError={() =>
                  setError("No se pudo iniciar con Google. Inténtalo de nuevo.")
                }
                text="signin_with"
                shape="pill"
                width={anchoGoogle}
              />
            </div>
          </>
        ) : (
          <>
            <div className="auth-divider">
              <span>o continúa con</span>
            </div>
            <button
              type="button"
              className="auth-google-placeholder"
              disabled
              aria-describedby="google-pendiente"
            >
              Continuar con Google
            </button>
            <p id="google-pendiente" className="auth-provider-note">
              Se habilita al configurar el Client ID de Google del taller.
            </p>
          </>
        )}

        <div className="auth-footnote">
          <span aria-hidden="true">♧</span> Acceso privado para el equipo
          Fran-Costuras
        </div>
        {sesionActiva() && (
          <p className="auth-session-note" role="status">
            Ya tienes una sesión activa.
          </p>
        )}
      </section>
      <footer className="auth-footer">
        Fran-Costuras <span>·</span> Diseña, Cose, Crea
      </footer>
    </main>
  );
}
