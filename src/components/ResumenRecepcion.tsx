import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarPedidos, type Pedido } from "../api/pedidos";
import IconoFC, { type NombreIconoFC } from "./IconoFC";
import InsigniaEstado from "./InsigniaEstado";

interface Resumen {
  pendientes: number;
  enProceso: number;
  terminados: number;
  proximos: Pedido[];
}

/* Métricas y tabla de entregas de la pantalla «01 · Inicio» del Figma.
 * Solo lee los listados existentes de /pedidos/ (el campo count de cada
 * estado); no calcula reglas de negocio. Si la API falla, no se muestra. */
export default function ResumenRecepcion() {
  const [resumen, setResumen] = useState<Resumen | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      listarPedidos("", 1, "PENDIENTE"),
      listarPedidos("", 1, "EN_PROCESO"),
      listarPedidos("", 1, "TERMINADO"),
      listarPedidos("", 1),
    ])
      .then(([pendientes, enProceso, terminados, todos]) => {
        if (!activo) return;
        setResumen({
          pendientes: pendientes.count,
          enProceso: enProceso.count,
          terminados: terminados.count,
          proximos: todos.results.slice(0, 6),
        });
      })
      .catch(() => {
        if (activo) setResumen(null);
      });
    return () => {
      activo = false;
    };
  }, []);

  if (!resumen) return null;

  const metricas: {
    titulo: string;
    cifra: number;
    detalle: string;
    icono: NombreIconoFC;
  }[] = [
    {
      titulo: "Listos para entregar",
      cifra: resumen.terminados,
      detalle: "Pedidos terminados listos para retirar",
      icono: "calendario",
    },
    {
      titulo: "Pendientes",
      cifra: resumen.pendientes,
      detalle: "Esperan iniciar producción",
      icono: "reloj",
    },
    {
      titulo: "En proceso",
      cifra: resumen.enProceso,
      detalle: "En el taller ahora mismo",
      icono: "tijeras",
    },
  ];

  return (
    <>
      <section className="fc-metricas" aria-label="Resumen de pedidos">
        {metricas.map((m) => (
          <article className="fc-metrica" key={m.titulo}>
            <div className="fc-metrica__head">
              <span className="fc-burbuja">
                <IconoFC nombre={m.icono} />
              </span>
              <span>{m.titulo}</span>
            </div>
            <strong className="fc-metrica__cifra">{m.cifra}</strong>
            <small>{m.detalle}</small>
          </article>
        ))}
      </section>
      <section className="fc-bloque" aria-labelledby="proximas-entregas">
        <div className="fc-bloque__titulo">
          <IconoFC nombre="calendario" size={20} />
          <h2 id="proximas-entregas">Próximas entregas</h2>
          <Link className="fc-chip-accion" to="/pedidos">
            <IconoFC nombre="flecha" size={14} />
            Ver tablero completo
          </Link>
        </div>
        {resumen.proximos.length === 0 ? (
          <p className="fc-vacio">No hay pedidos activos para mostrar.</p>
        ) : (
          <div className="fc-tabla-card table-responsive">
            <table className="table fc-tabla mb-0">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Prenda</th>
                  <th>Entrega</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {resumen.proximos.map((pedido) => (
                  <tr key={pedido.id}>
                    <td className="fw-bold">{pedido.codigo}</td>
                    <td>{pedido.cliente_nombre}</td>
                    <td>{pedido.prenda_nombre}</td>
                    <td>
                      <span className="fc-fecha">
                        <IconoFC nombre="calendario" size={16} />
                        {pedido.fecha_entrega}
                      </span>
                    </td>
                    <td>
                      <InsigniaEstado estado={pedido.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
