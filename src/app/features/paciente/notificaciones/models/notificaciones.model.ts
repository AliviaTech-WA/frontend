
export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string | null;
  leido: boolean;
  fechaCreacion: string;
}
