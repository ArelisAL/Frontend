/* Insignia de estado del diseño Figma (componente «Insignia de estado»).
 * Estados de pedido con la marca y texto gris violeta (AGENTS.md §12.4).
 * Muestra el mismo texto que antes (el estado sin guiones bajos). */
const TONOS: Record<string, string> = {
  PENDIENTE: "fc-badge--pendiente",
  EN_PROCESO: "fc-badge--proceso",
  TERMINADO: "fc-badge--terminado",
  ENTREGADO: "fc-badge--entregado",
};

export default function InsigniaEstado({ estado }: { estado: string }) {
  return (
    <span className={`fc-badge ${TONOS[estado] ?? "fc-badge--entregado"}`}>
      {estado.replace(/_/g, " ")}
    </span>
  );
}
