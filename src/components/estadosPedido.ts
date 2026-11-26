/* Solo textos de pantalla: nombre del estado que sigue, en el orden fijo del
 * DERCAS (Pendiente → En proceso → Terminado → Entregado), para rotular el
 * botón y el diálogo del diseño. No decide nada: la API valida cada cambio. */
export const ETIQUETA_SIGUIENTE_ESTADO: Record<string, string> = {
  PENDIENTE: "En proceso",
  EN_PROCESO: "Terminado",
  TERMINADO: "Entregado",
};
