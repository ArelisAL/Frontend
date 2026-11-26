import type { ReactNode } from "react";
import IconoFC, { type NombreIconoFC } from "./IconoFC";

/* Franja de aviso del diseño Figma (fondo amarillo suave, verde menta o
 * borde rojo para errores). Solo presentación. */
export default function Aviso({
  tono = "info",
  icono = "alerta",
  children,
  role,
}: {
  tono?: "info" | "exito" | "error" | "neutro";
  icono?: NombreIconoFC;
  children: ReactNode;
  role?: "alert" | "status";
}) {
  return (
    <div className={`fc-aviso fc-aviso--${tono}`} role={role}>
      <IconoFC nombre={icono} size={18} />
      <div>{children}</div>
    </div>
  );
}
