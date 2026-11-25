import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { cambiarContrasena } from "../api/auth";
import { extraerMensajeError } from "../api/errores";

/**
 * Pantalla "Cambiar contraseña" para primer ingreso (RF-M0-05, DERCAS §5.1 SEG-03):
 * inputs de contraseña actual + nueva. Al éxito se activa el resto del sistema.
 * Validación final está en el Backend; aquí solo ayudamos al usuario.
 */
export default function CambiarContrasenaPage({
  onCambioCorrecto,
}: {
  onCambioCorrecto?: () => void;
}) {
  const navigate = useNavigate();
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [cambioOk, setCambioOk] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await cambiarContrasena(contrasenaActual, nuevaContrasena);
      onCambioCorrecto?.();
      setCambioOk(true);
      navigate("/", { replace: true });
    } catch (e) {
      setError(extraerMensajeError(e));
    } finally {
      setCargando(false);
    }
  }

  return (
    <main
      className="d-flex align-items-center justify-content-center px-3"
      style={{ minHeight: "100vh", backgroundColor: "var(--fc-fondo)" }}
    >
      <div
        className="login-card rounded-4 p-5 shadow-lg"
        style={{ backgroundColor: "var(--fc-blanco-lavanda)" }}
      >
        <h2 className="mb-3 text-center" style={{ color: "var(--fc-titulo)" }}>
          Cambiar contraseña
        </h2>
        {error && (
          <div
            className="alert"
            style={{ backgroundColor: "var(--fc-error)", color: "#ffffff" }}
          >
            {error}
          </div>
        )}
        {cambioOk && (
          <div
            className="alert"
            style={{ backgroundColor: "var(--fc-exito)", color: "#ffffff" }}
          >
            Contraseña cambiada correctamente. El resto del sistema queda
            activado.
          </div>
        )}
        <form onSubmit={enviar} className="d-flex flex-column gap-3">
          <div>
            <label
              htmlFor="contrasenaActual"
              className="form-label fw-semibold"
            >
              Contraseña actual
            </label>
            <input
              id="contrasenaActual"
              name="contrasenaActual"
              type="password"
              required
              value={contrasenaActual}
              onChange={(e) => setContrasenaActual(e.target.value)}
              className="form-control"
            />
          </div>
          <div>
            <label htmlFor="nuevaContrasena" className="form-label fw-semibold">
              Nueva contraseña
            </label>
            <input
              id="nuevaContrasena"
              name="nuevaContrasena"
              type="password"
              required
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              className="form-control"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={cargando}>
            {cargando ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </main>
  );
}
