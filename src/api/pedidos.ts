import { api } from "./http";
import type { Pagina, Prenda } from "./clientes";

export interface Pedido {
  id: number;
  codigo: string;
  cliente: number;
  cliente_nombre: string;
  prenda: number;
  prenda_nombre: string;
  categoria_codigo: string;
  descripcion: string;
  fecha_entrega: string;
  estado: string;
  costurera: number | null;
  costurera_nombre: string | null;
  nota_interna: string;
  total: string;
  creado_en: string;
  entregado_en: string | null;
  medidas_ultima_toma: {
    valores_cm: Record<string, number>;
    fecha: string;
    categoria: string;
  } | null;
}

export async function listarPrendasPedidos(
  categoria?: string,
): Promise<Pagina<Prenda>> {
  const { data } = await api.get<Pagina<Prenda>>("/catalogo/prendas/", {
    params: categoria ? { categoria } : undefined,
  });
  return data;
}

export async function listarPedidos(
  q = "",
  page = 1,
  estado?: string,
  propios = false,
): Promise<Pagina<Pedido>> {
  const { data } = await api.get<Pagina<Pedido>>(
    propios ? "/mis-pedidos/" : "/pedidos/",
    {
      params: {
        ...(q ? { q } : {}),
        page,
        ...(estado
          ? {
              estado,
              ...(estado === "ENTREGADO" ? { incluir_entregados: true } : {}),
            }
          : {}),
      },
    },
  );
  return data;
}

export async function listarPedidosParaPagos(
  q = "",
  page = 1,
): Promise<Pagina<Pedido>> {
  const { data } = await api.get<Pagina<Pedido>>("/pedidos/", {
    params: {
      ...(q ? { q } : {}),
      page,
      incluir_entregados: true,
    },
  });
  return data;
}

export async function crearPedido(datos: {
  cliente: number;
  prenda: number;
  fecha_entrega: string;
  descripcion: string;
}): Promise<Pedido> {
  const { data } = await api.post<Pedido>("/pedidos/", datos);
  return data;
}

export async function obtenerPedido(codigo: string): Promise<Pedido> {
  const { data } = await api.get<Pedido>(`/pedidos/${codigo}/`);
  return data;
}

export async function guardarNotaInterna(
  codigo: string,
  nota_interna: string,
): Promise<Pedido> {
  const { data } = await api.patch<Pedido>(`/pedidos/${codigo}/notas/`, {
    nota_interna,
  });
  return data;
}

export interface HistorialEstado {
  id: number;
  estado_anterior: string;
  estado_nuevo: string;
  fecha_hora: string;
  usuario_nombre: string;
}

export interface OpcionTelaConsumo {
  id: number;
  nombre: string;
  color: string;
  metros_disponibles: string;
}

export interface UsoTelaPedido {
  id: number;
  tela: number;
  tela_nombre: string;
  tela_color: string;
  metros_usados: string;
  registrado_por_nombre: string | null;
  confirmado: boolean;
  vigente: boolean;
  reemplazado_en: string | null;
  reemplazado_por_nombre: string | null;
  fecha: string;
}

export async function listarOpcionesTelaConsumo(): Promise<
  Pagina<OpcionTelaConsumo>
> {
  const { data } = await api.get<Pagina<OpcionTelaConsumo>>(
    "/telas/opciones-consumo/",
  );
  return data;
}

export async function listarConsumosPedido(
  codigo: string,
): Promise<Pagina<UsoTelaPedido>> {
  const { data } = await api.get<Pagina<UsoTelaPedido>>(
    `/pedidos/${codigo}/consumos/`,
  );
  return data;
}

export async function registrarConsumosPedido(
  codigo: string,
  usos: { tela: number; metros_usados: string }[],
): Promise<UsoTelaPedido[]> {
  const { data } = await api.post<UsoTelaPedido[]>(
    `/pedidos/${codigo}/consumos/`,
    { usos },
  );
  return data;
}

export async function cambiarEstadoPedido(
  codigo: string,
): Promise<HistorialEstado> {
  const { data } = await api.post<HistorialEstado>(
    `/pedidos/${codigo}/estado/`,
    {
      confirmar: true,
    },
  );
  return data;
}

export async function listarHistorialPedido(
  codigo: string,
): Promise<Pagina<HistorialEstado>> {
  const { data } = await api.get<Pagina<HistorialEstado>>(
    `/pedidos/${codigo}/historial/`,
  );
  return data;
}
