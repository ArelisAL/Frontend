import { api } from "./http";
import type { Pagina } from "./clientes";

export interface Pago {
  id: number;
  pedido: number;
  monto: string;
  fecha: string;
  registrado_por: number;
  registrado_por_nombre: string;
  anulado: boolean;
  anulado_por: number | null;
  anulado_por_nombre: string | null;
}

export interface PaginaPagos extends Pagina<Pago> {
  saldo: string;
}

export interface PagoConSaldo extends Pago {
  saldo: string;
}

export async function listarPagos(
  codigo: string,
  page = 1,
): Promise<PaginaPagos> {
  const { data } = await api.get<PaginaPagos>(`/pedidos/${codigo}/pagos/`, {
    params: { page },
  });
  return data;
}

export async function registrarPago(
  codigo: string,
  monto: string,
): Promise<PagoConSaldo> {
  const { data } = await api.post<PagoConSaldo>(`/pedidos/${codigo}/pagos/`, {
    monto,
  });
  return data;
}
