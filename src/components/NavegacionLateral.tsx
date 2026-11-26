import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Usuario } from "../api/auth";
import logoFranCosturas from "../assets/logo-fran-costuras.png";
import IconoFC, { type NombreIconoFC } from "./IconoFC";
import { iniciales } from "./iniciales";

interface Item {
  texto: string;
  destino: string;
  icono: NombreIconoFC;
  activo: (ruta: string, hash: string) => boolean;
}

const ETIQUETA_ROL: Record<string, string> = {
  administradora: "Administradora",
  recepcionista: "Recepcionista",
  costurera: "Costurera",
};

/* Barra lateral del diseño Figma «Navegación lateral · Recepción» (20:826).
 * Solo muestra los módulos que el rol ya tenía en la barra superior; las
 * entradas «Nuevo pedido» y «Cobros y abonos» llevan a sus secciones dentro
 * de /pedidos, y «Entregas» es la vista nueva propuesta en el diseño. */
export default function NavegacionLateral({
  usuario,
  onCerrarSesion,
}: {
  usuario: Usuario;
  onCerrarSesion: () => void;
}) {
  const { pathname, hash } = useLocation();
  const atiendeRecepcion =
    usuario.rol === "administradora" || usuario.rol === "recepcionista";

  const items: Item[] = [
    {
      texto: "Inicio",
      destino: "/",
      icono: "resumen",
      activo: (ruta) => ruta === "/",
    },
    ...(atiendeRecepcion
      ? [
          {
            texto: "Clientes y medidas",
            destino: "/clientes",
            icono: "equipo" as const,
            activo: (ruta: string) => ruta === "/clientes",
          },
          {
            texto: "Nuevo pedido",
            destino: "/pedidos#registrar-pedido",
            icono: "mas" as const,
            activo: (ruta: string, h: string) =>
              ruta === "/pedidos" && h === "#registrar-pedido",
          },
        ]
      : []),
    {
      texto: "Pedidos",
      destino: "/pedidos",
      icono: "tijeras",
      activo: (ruta, h) =>
        ruta === "/pedidos" && h !== "#registrar-pedido" && h !== "#cobros",
    },
    ...(atiendeRecepcion
      ? [
          {
            texto: "Entregas",
            destino: "/entregas",
            icono: "calendario" as const,
            activo: (ruta: string) => ruta === "/entregas",
          },
          {
            texto: "Cobros y abonos",
            destino: "/pedidos#cobros",
            icono: "pagos" as const,
            activo: (ruta: string, h: string) =>
              ruta === "/pedidos" && h === "#cobros",
          },
        ]
      : []),
  ];

  // Lleva a la sección indicada por el ancla cuando la pantalla ya la pintó.
  useEffect(() => {
    if (!hash) return;
    let intentos = 0;
    let temporizador = 0;
    const buscar = () => {
      const destino = document.getElementById(
        decodeURIComponent(hash.slice(1)),
      );
      if (destino) {
        destino.scrollIntoView?.({ behavior: "smooth", block: "start" });
        return;
      }
      if (intentos++ < 20) temporizador = window.setTimeout(buscar, 100);
    };
    buscar();
    return () => window.clearTimeout(temporizador);
  }, [pathname, hash]);

  return (
    <aside className="fc-sidebar">
      <Link to="/" className="fc-sidebar__brand">
        <img src={logoFranCosturas} alt="Fran-Costuras — Diseña, Cose, Crea" />
      </Link>
      <p className="fc-eyebrow fc-sidebar__label">
        {usuario.rol === "costurera" ? "TALLER" : "RECEPCIÓN"}
      </p>
      <nav className="fc-sidebar__nav" aria-label="Navegación principal">
        {items.map((item) => {
          const activo = item.activo(pathname, hash);
          return (
            <Link
              key={item.texto}
              to={item.destino}
              className={`fc-sidebar__link${activo ? " is-active" : ""}`}
              aria-current={activo ? "page" : undefined}
            >
              <IconoFC nombre={item.icono} size={20} />
              <span>{item.texto}</span>
            </Link>
          );
        })}
      </nav>
      <div className="fc-sidebar__footer">
        <div className="fc-sidebar__user">
          <span className="fc-avatar" aria-hidden="true">
            {iniciales(usuario.nombre || usuario.email)}
          </span>
          <span className="fc-sidebar__user-data">
            <strong>{usuario.nombre}</strong>
            <small>{ETIQUETA_ROL[usuario.rol] ?? usuario.rol}</small>
          </span>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary fc-sidebar__logout"
          onClick={onCerrarSesion}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
