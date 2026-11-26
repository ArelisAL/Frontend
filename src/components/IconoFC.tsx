/* Íconos de trazo del diseño Figma «Fran-Costuras · AdminWeb», página
 * «Frontend · Recepcionista» (componentes Icono/*).
 * Copiados tal cual (viewBox 24×24, trazo 1,8) y pintados con currentColor para
 * heredar el color de la marca desde CSS. */
export type NombreIconoFC =
  | "aguja"
  | "alerta"
  | "buscar"
  | "calendario"
  | "candado"
  | "carrete"
  | "cheque"
  | "editar"
  | "equipo"
  | "flecha"
  | "inventario"
  | "mas"
  | "pagos"
  | "prenda"
  | "reloj"
  | "resumen"
  | "servicios"
  | "tijeras";

const TRAZOS: Record<NombreIconoFC, string[]> = {
  aguja: [
    "M10 14L5 19",
    "M14 5L19 10",
    "M19 5L10 14",
    "M21.5 4C21.5 4.828 20.828 5.5 20 5.5C19.172 5.5 18.5 4.828 18.5 4C18.5 3.172 19.172 2.5 20 2.5C20.828 2.5 21.5 3.172 21.5 4Z",
  ],
  alerta: ["M12 3L22 20H2L12 3Z", "M12 10V14", "M12 17.2V17.4"],
  buscar: [
    "M17 11C17 14.314 14.314 17 11 17C7.686 17 5 14.314 5 11C5 7.686 7.686 5 11 5C14.314 5 17 7.686 17 11Z",
    "M20 20L15.5 15.5",
  ],
  calendario: [
    "M5 5H19C20.105 5 21 5.895 21 7V19C21 20.105 20.105 21 19 21H5C3.895 21 3 20.105 3 19V7C3 5.895 3.895 5 5 5Z",
    "M16 3V7M8 3V7M3 10H21",
  ],
  candado: [
    "M7 11H17C18.105 11 19 11.895 19 13V19C19 20.105 18.105 21 17 21H7C5.895 21 5 20.105 5 19V13C5 11.895 5.895 11 7 11Z",
    "M8 11V7.5C8 5.291 9.791 3.5 12 3.5C14.209 3.5 16 5.291 16 7.5V11",
  ],
  carrete: [
    "M8 3H16L15 7L17 21H7L9 7L8 3Z",
    "M8.5 7H15.5",
    "M7.6 12H16.4",
    "M7.2 17H16.8",
  ],
  cheque: ["M5 12.5L10 17L19 7"],
  editar: ["M4 20H8L19 9L15 5L4 16V20Z", "M13.5 6.5L17.5 10.5"],
  equipo: [
    "M12.5 8C12.5 9.933 10.933 11.5 9 11.5C7.067 11.5 5.5 9.933 5.5 8C5.5 6.067 7.067 4.5 9 4.5C10.933 4.5 12.5 6.067 12.5 8Z",
    "M3 20C3 16.686 5.686 14 9 14C12.314 14 15 16.686 15 20",
    "M15.5 4.7C17.1 5.1 18.3 6.4 18.3 8C18.3 9.6 17.1 10.9 15.5 11.3",
    "M18 14.6C19.8 15.4 21 17.2 21 19.5",
  ],
  flecha: ["M5 12H19", "M13 6L19 12L13 18"],
  inventario: [
    "M3 7L12 3L21 7L12 11L3 7Z",
    "M3 7V17L12 21L21 17V7",
    "M12 11V21",
  ],
  mas: ["M12 5V19M5 12H19"],
  pagos: [
    "M5 6H19C20.105 6 21 6.895 21 8V18C21 19.105 20.105 20 19 20H5C3.895 20 3 19.105 3 18V8C3 6.895 3.895 6 5 6Z",
    "M3 10H21",
    "M16 15H18",
    "M6 6V4.5H16V6",
  ],
  prenda: [
    "M20.4 3.5L16.3 2.1C16.087 3.082 15.544 3.962 14.762 4.592C13.98 5.223 13.005 5.567 12 5.567C10.995 5.567 10.02 5.223 9.238 4.592C8.456 3.962 7.913 3.082 7.7 2.1L3.6 3.5C3.158 3.59 2.76 3.827 2.469 4.171C2.179 4.516 2.013 4.949 2 5.4V11C2 11.265 2.105 11.52 2.293 11.707C2.48 11.895 2.735 12 3 12H5V22H19V12H21C21.265 12 21.52 11.895 21.707 11.707C21.895 11.52 22 11.265 22 11V5.4C21.987 4.949 21.821 4.516 21.531 4.171C21.24 3.827 20.842 3.59 20.4 3.5Z",
  ],
  reloj: [
    "M21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3C16.971 3 21 7.029 21 12Z",
    "M12 7V12L15 14",
  ],
  resumen: [
    "M4 4H11V11H4V4Z",
    "M13 4H20V11H13V4Z",
    "M4 13H11V20H4V13Z",
    "M13 13H20V20H13V13Z",
  ],
  servicios: [
    "M3 12V4C3 3.448 3.448 3 4 3H12L21 12L12 21L3 12Z",
    "M9 7.5C9 8.328 8.328 9 7.5 9C6.672 9 6 8.328 6 7.5C6 6.672 6.672 6 7.5 6C8.328 6 9 6.672 9 7.5Z",
  ],
  tijeras: [
    "M9 6C9 7.65685 7.65685 9 6 9C4.34315 9 3 7.65685 3 6C3 4.34315 4.34315 3 6 3C7.65685 3 9 4.34315 9 6Z",
    "M9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15C7.65685 15 9 16.3431 9 18Z",
    "M8.1 8.1L12 12",
    "M20 4L8.1 15.9",
    "M14.8 14.8L20 20",
  ],
};

interface IconoFCProps {
  nombre: NombreIconoFC;
  size?: number;
  className?: string;
}

export default function IconoFC({
  nombre,
  size = 24,
  className,
}: IconoFCProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {TRAZOS[nombre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
