import { useEffect, useRef, useState } from "react";
import {
  listarConsumosPedido,
  type Pedido,
  type UsoTelaPedido,
} from "../api/pedidos";
import Aviso from "./Aviso";
import IconoFC from "./IconoFC";
import { ETIQUETA_SIGUIENTE_ESTADO } from "./estadosPedido";

/* Diálogo «05 · Confirmar paso a «En proceso»» del Figma (Frontend ·
 * Costurera). Solo presentación: lista los consumos de tela ya registrados
 * (GET /pedidos/{codigo}/consumos/) y pide confirmación. La decisión, el
 * descuento de inventario y el error de stock son de la API. */
export default function DialogoAvanceEstado({
  pedido,
  enviando,
  onConfirmar,
  onCancelar,
}: {
  pedido: Pedido;
  enviando: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const siguiente = ETIQUETA_SIGUIENTE_ESTADO[pedido.estado];
  const iniciaProduccion = pedido.estado === "PENDIENTE";
  const [consumos, setConsumos] = useState<UsoTelaPedido[]>([]);
  const botonCancelar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    botonCancelar.current?.focus();
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onCancelar();
    };
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [onCancelar]);

  useEffect(() => {
    if (!iniciaProduccion) return;
    let vigente = true;
    listarConsumosPedido(pedido.codigo)
      .then((pagina) => {
        if (vigente) setConsumos(pagina.results.filter((uso) => uso.vigente));
      })
      .catch(() => {
        if (vigente) setConsumos([]);
      });
    return () => {
      vigente = false;
    };
  }, [pedido.codigo, iniciaProduccion]);

  return (
    <div className="fc-dialogo__fondo" onClick={onCancelar}>
      <div
        className="fc-dialogo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-dialogo-estado"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fc-card__titulo">
          <IconoFC nombre={iniciaProduccion ? "carrete" : "cheque"} size={20} />
          <h2 id="titulo-dialogo-estado">
            {siguiente
              ? `¿Pasar ${pedido.codigo} a «${siguiente}»?`
              : `¿Confirmas avanzar ${pedido.codigo} al siguiente estado?`}
          </h2>
        </div>
        <p className="fc-dialogo__texto">
          {iniciaProduccion
            ? "Al confirmar, la API descuenta del inventario las telas registradas para el pedido. "
            : ""}
          Los estados solo avanzan: después no se puede volver al estado
          anterior.
        </p>
        {iniciaProduccion && consumos.length > 0 && (
          <ul className="fc-consumos">
            {consumos.map((uso) => (
              <li key={uso.id}>
                <span>
                  {uso.tela_nombre} · {uso.tela_color}
                </span>
                <strong>{uso.metros_usados} m</strong>
              </li>
            ))}
          </ul>
        )}
        {iniciaProduccion && (
          <Aviso>
            Si alguna tela no alcanza, se rechaza todo el cambio y no se
            descuenta nada.
          </Aviso>
        )}
        <div className="fc-form__acciones">
          <button
            ref={botonCancelar}
            type="button"
            className="btn btn-outline-primary"
            onClick={onCancelar}
            disabled={enviando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirmar}
            disabled={enviando}
          >
            {enviando
              ? "Confirmando…"
              : iniciaProduccion
                ? "Confirmar y descontar telas"
                : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
