import { api } from "./http";

export interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  correo: string;
}

export interface Pagina<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TipoMedida {
  codigo: string;
  nombre: string;
  como_se_toma: string;
}

export interface Categoria {
  id: number;
  codigo: string;
  nombre: string;
  tipos_medida: TipoMedida[];
}

export interface Prenda {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
}

export interface PrendaMedida extends TipoMedida {
  opcional: boolean;
}

export interface Medida {
  id: number;
  cliente: number;
  categoria: string;
  prenda: string | null;
  valores_cm: Record<string, number>;
  fecha: string;
  tomada_por: string;
}

export async function listarClientes(
  q = "",
  page = 1,
): Promise<Pagina<Cliente>> {
  const { data } = await api.get<Pagina<Cliente>>("/clientes/", {
    params: { ...(q ? { q } : {}), page },
  });
  return data;
}

export async function crearCliente(
  datos: Omit<Cliente, "id">,
): Promise<Cliente> {
  const { data } = await api.post<Cliente>("/clientes/", datos);
  return data;
}

export async function listarCategorias(): Promise<Pagina<Categoria>> {
  const { data } = await api.get<Pagina<Categoria>>("/catalogo/categorias/");
  return data;
}

export async function listarPrendas(
  categoria: string,
): Promise<Pagina<Prenda>> {
  const { data } = await api.get<Pagina<Prenda>>("/catalogo/prendas/", {
    params: { categoria },
  });
  return data;
}

export async function listarMedidasPrenda(
  id: number,
): Promise<Pagina<PrendaMedida>> {
  const { data } = await api.get<Pagina<PrendaMedida>>(
    `/catalogo/prendas/${id}/medidas/`,
  );
  return data;
}

export async function listarMedidasCliente(
  id: number,
  page = 1,
): Promise<Pagina<Medida>> {
  const { data } = await api.get<Pagina<Medida>>(`/clientes/${id}/medidas/`, {
    params: { page },
  });
  return data;
}

export async function registrarMedida(
  cliente: number,
  payload: {
    categoria: string;
    prenda: number | null;
    valores_cm: Record<string, number>;
  },
): Promise<Medida> {
  const { data } = await api.post<Medida>(
    `/clientes/${cliente}/medidas/`,
    payload,
  );
  return data;
}
