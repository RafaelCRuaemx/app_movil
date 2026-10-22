/**
 * Interfaces y tipos del Checador Móvil Institucional.
 */

export interface Usuario {
  id: number;
  nombre?: string;
  email?: string;
  correo?: string;
  rol?: string;
  numero_empleado?: string;
  oficina_id?: number;
  oficina_nombre?: string;
  foto_perfil?: string | null;
  token?: string;
  [key: string]: any;
}

export interface ProgresoPaso {
  paso: string;
  titulo: string;
  hora: string | null;
  completado: boolean;
  actual: boolean;
}

export interface DashboardProgreso {
  horas_trabajadas?: string;
  porcentaje?: number;
  pasos?: ProgresoPaso[];
  entrada?: string | null;
  salida_comida?: string | null;
  regreso_comida?: string | null;
  salida?: string | null;
  [key: string]: any;
}

export interface DashboardResumen {
  puntuales?: number;
  retardos?: number;
  faltas?: number;
}

export interface DashboardData {
  proximo_paso?: string;
  hero_btn_text?: string;
  saludo_nombre?: string;
  es_home_office?: boolean;
  progreso_hoy?: DashboardProgreso;
  resumen_mes?: DashboardResumen;
  fechas_retardos?: string[];
  fechas_faltas?: string[];
  [key: string]: any;
}

export interface HistorialRegistro {
  id?: number;
  fecha: string;
  entrada?: string | null;
  comida_salida?: string | null;
  comida_regreso?: string | null;
  salida?: string | null;
  estado?: string;
  horas_trabajadas?: string | null;
  tipo?: string;
  motivo?: string | null;
}

// Alias para compatibilidad
export type HistoriaRegistro = HistorialRegistro;

export interface PerfilData {
  id: number;
  nombre: string;
  correo?: string;
  rol: string;
  numero_empleado?: string;
  oficina?: string;
  dias_laborales?: string;
  horario_entrada?: string;
  horario_salida?: string;
  fecha_ingreso?: string;
  fecha_creacion?: string;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  motivo?: string;
  data?: T;
  user?: Usuario;
  dashboard?: DashboardData;
  perfil?: PerfilData;
  historial?: HistorialRegistro[];
  token?: string;
  requiere_2fa?: boolean;
  usuario_id?: number;
  [key: string]: any;
}