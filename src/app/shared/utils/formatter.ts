// src/app/shared/utils/formatters.ts
/**
 * Clase de utilidades para dar formato a datos
 */
export class Formatters {
    /**
     * Formatea una fecha ISO a formato local
     * @param isoDate Fecha en formato ISO
     * @returns Fecha formateada en formato local
     */
    static formatDate(isoDate: string): string {
      try {
        const date = new Date(isoDate);
        return date.toLocaleDateString();
      } catch (e) {
        return isoDate;
      }
    }
    
    /**
     * Formatea una hora en formato legible
     * @param time Hora en formato ISO o string
     * @returns Hora formateada
     */
    static formatTime(time: string): string {
      try {
        if (time.includes('T')) {
          // Es una fecha ISO completa
          const date = new Date(time);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return time;
      } catch (e) {
        return time;
      }
    }
    
    /**
     * Obtiene un id corto basado en un string
     * @param id ID completo
     * @param length Longitud deseada
     * @returns ID recortado
     */
    static shortId(id: string, length: number = 8): string {
      if (!id) return '';
      return id.length > length ? id.substring(0, length) : id;
    }
    
    /**
     * Formatea un nombre de estudiante
     * @param firstName Nombre
     * @param lastName Apellido
     * @returns Nombre completo formateado
     */
    static formatStudentName(firstName: string, lastName: string): string {
      if (!firstName && !lastName) return '';
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    
    /**
     * Formatea un nivel y grado en formato legible
     * @param nivel Nivel (primaria, secundaria)
     * @param grado Grado (1-6)
     * @param seccion Sección (A-F)
     * @returns Texto formateado
     */
    static formatGradoNivel(nivel?: string, grado?: number, seccion?: string): string {
        if (!nivel && !grado) return '';
        return `${nivel || ''} ${grado !== undefined ? grado : ''}° "${seccion || ''}"`.trim();
      }
    
    /**
     * Formatea el estado de asistencia para mejor legibilidad
     * @param estado Estado original (PUNTUAL, TARDANZA, etc)
     * @returns Estado formateado
     */
    static formatEstado(estado: string): string {
      if (!estado) return '';
      
      const estadoUpper = estado.toUpperCase();
      
      switch (estadoUpper) {
        case 'PUNTUAL':
          return 'Puntual';
        case 'TARDANZA':
          return 'Tardanza';
        case 'FALTA':
          return 'Falta';
        case 'ERROR':
          return 'Error';
        default:
          // Capitalizar primera letra
          return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
      }
    }
    
    /**
     * Formatea la hora en un formato adecuado para mostrar
     * @param hora Hora a formatear
     * @returns Hora formateada
     */
    static formatHoraAsistencia(hora: string): string {
      if (!hora) return '';
      
      // Si ya está en formato de 12 horas (2:30 PM), devolverlo así
      if (hora.includes('AM') || hora.includes('PM')) {
        return hora;
      }
      
      try {
        // Intentar convertir de formato 24h a 12h
        const [hours, minutes] = hora.split(':');
        const hoursNum = parseInt(hours, 10);
        
        const period = hoursNum >= 12 ? 'PM' : 'AM';
        const hours12 = hoursNum % 12 || 12; // Convertir 0 a 12
        
        return `${hours12}:${minutes} ${period}`;
      } catch (e) {
        // Si hay un error, devolver la hora original
        return hora;
      }
    }
  }