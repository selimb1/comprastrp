export type TipoContribuyente = 'Responsable Inscripto' | 'Monotributista' | 'Consumidor Final' | 'Exento';

export interface Client {
  id: string;
  user_id: string; // ID del Contador/Estudio
  razon_social: string;
  cuit: string; // Formato con guiones o sin guiones, ideal unificado.
  tipo_contribuyente: TipoContribuyente;
  condicion_iva: string;
  direccion?: string;
  email?: string;
  telefono?: string;
  notas?: string;
  activo: boolean;
  created_at: string;
}

export interface ClientCreatePayload {
  razon_social: string;
  cuit: string;
  tipo_contribuyente: TipoContribuyente;
  condicion_iva: string;
  direccion?: string;
  email?: string;
  telefono?: string;
  notas?: string;
}
