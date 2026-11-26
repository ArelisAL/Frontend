import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarPedidos, type Pedido } from "../api/pedidos";
import Aviso from "./Aviso";
import IconoFC, { type NombreIconoFC } from "./IconoFC";
import InsigniaEstado from "./InsigniaEstado";

interface Resumen {
  pendientes: number;
  enProceso: number;
  terminados: number;
  proximos: Pedido[];
}

/* Métricas y «Mis próximas entregas» de la pantalla «01 · Inicio · Mi resumen»
 * (Figma, página «Frontend · Costurera»). Solo lee /mis-pedidos/ (el campo
 * count de cada estado y la primera página, que la API ya ordena por fecha de
 * entrega). La tarjeta «Entregan esta semana» y la columna «Siguiente paso»
 * del diseño no se muestran: la API no entrega esos datos. */
export default function ResumenTaller() {
  const [resumen, setResumen] = useState<Resumen | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      listarPedidos("", 1, "PENDIENTE", true),
      listarPedidos("", 1, "EN_PROCESO", true),
      listarPedidos("", 1, "TERMINADO", true),
      listarPedidos("", 1, undefined, true),
    ])
      .then(([pendientes, enProceso, terminados, todos]) => {
        if (!activo) return;
        setResumen({
          pendientes: pendientes.count,
          enProceso: enProceso.count,
          terminados: terminados.count,
          proximos: todos.results.slice(0, 5),
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
      titulo: "Pendientes",
      cifra: resumen.pendientes,
      detalle: "Esperan que los inicies",
      icono: "reloj",
    },
    {
      titulo: "En proceso",
      cifra: resumen.enProceso,
      detalle: "Estás trabajando en ellos",
      icono: "tijeras",
    },
    {
      titulo: "Terminados",
      cifra: resumen.terminados,
      detalle: "Listos para que recepción entregue",
      icono: "prenda",
    },
  ];

  return (
    <>
      <section className="fc-metricas" aria-label="Resumen de mis pedidos">
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
      <section className="fc-bloque" aria-labelledby="mis-proximas-entregas">
        <div className="fc-bloque__titulo">
          <IconoFC nombre="calendario" size={20} />
          <h2 id="mis-proximas-entregas">Mis próximas entregas</h2>
          <Link className="fc-chip-accion" to="/pedidos">
            <IconoFC nombre="flecha" size={14} />
            Ver todos mis pedidos
          </Link>
        </div>
        {resumen.proximos.length === 0 ? (
          <p className="fc-vacio">No tienes pedidos activos asignados.</p>
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
        <Aviso>
          Al iniciar un pedido («En proceso») se descuenta la tela del
          inventario. Si no alcanza, el cambio se rechaza completo.
        </Aviso>
      </section>
    </>
  );
}
