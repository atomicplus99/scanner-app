// src/app/models/registro.model.ts
export interface Turno {
  id_turno: string;
  hora_inicio: string;
  hora_fin: string;
  hora_limite: string;
  turno: string;
}

export interface Usuario {
  id_user: string;
  nombre_usuario: string;
  password_user: string;
  rol_usuario: string;
  profile_image: string;
}

export interface Alumno {
  id_alumno: string;
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  direccion: string;
  codigo_qr: string;
  nivel: string;
  grado: number;
  seccion: string;
  turno: Turno;
  usuario: Usuario;
}

export interface AsistenciaResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data?: {
    mensaje: string;
    asistencia: {
      id_asistencia: string;
      hora_de_llegada: string;
      hora_salida: string | null;
      estado_asistencia: string;
      fecha: string;
      alumno: Alumno;
    };
  };
  // Fallback para estructura antigua
  mensaje?: string;
  asistencia?: {
    id_asistencia: string;
    hora_de_llegada: string;
    hora_salida: string | null;
    estado_asistencia: string;
    fecha: string;
    alumno: Alumno;
  };
}

export interface Registro {
  id: string;
  estudiante: {
    nombre: string;
    apellido: string;
    codigo: string;
    grado: number;
    seccion: string;
    nivel: string;
  };
  hora: string;
  fecha: string;
  tipo: 'entrada' | 'salida';
  status: 'success' | 'error';
  estado: string;
  mensaje: string;
  imgProfile?: string;
}

export interface Statistic {
  icon: string;
  title: string;
  value: number;
  color: string;
}