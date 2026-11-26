import type { ReactNode } from "react";

/* Encabezado de pantalla del diseño Figma: etiqueta pequeña, título principal,
 * descripción opcional y acciones a la derecha. */
export default function EncabezadoPagina({
  etiqueta,
  titulo,
  descripcion,
  acciones,
  id,
}: {
  etiqueta: ReactNode;
  titulo: ReactNode;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  id?: string;
}) {
  return (
    <header className="fc-page-header">
      <div className="fc-page-header__copy">
        <p className="fc-eyebrow">{etiqueta}</p>
        <h1 id={id}>{titulo}</h1>
        {descripcion && <p className="fc-page-header__text">{descripcion}</p>}
      </div>
      {acciones && <div className="fc-page-header__actions">{acciones}</div>}
    </header>
  );
}
