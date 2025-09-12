// src/app/services/api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AsistenciaResponse } from '../models/registro.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  
  /**
   * Envía el código QR escaneado al servidor para registrar asistencia
   * @param qrCode Código QR escaneado
   * @returns Observable con la respuesta del servidor
   */
  scanQrCode(qrCode: string): Observable<AsistenciaResponse> {
    const payload = { codigo_qr: qrCode.trim() };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<AsistenciaResponse>(
      `${this.apiUrl}/asistencia/scan`, 
      payload,
      { headers: headers }
    ).pipe(
      tap(() => console.log('Se hizo peticion')),
      catchError(this.handleError)
    );
  }
  
  /**
   * Verifica la conexión con el servidor
   * @returns Observable con respuesta del ping
   */
  checkServerStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ping`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /**
   * Devuelve la URL base del servidor
   * @returns URL del servidor
   */
  getServerUrl(): string {
    return this.apiUrl;
  }
  
  /**
   * Maneja errores HTTP de manera centralizada
   * @param error Error HTTP recibido
   * @returns Observable con el error tratado
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
      } else if (error.status === 400) {
        // Extraer el mensaje de error del servidor
        if (error.error && typeof error.error === 'object' && error.error.message) {
          errorMessage = error.error.message;
        } else {
          errorMessage = 'La solicitud contiene datos inválidos.';
        }
      } else if (error.status === 401) {
        errorMessage = 'No tiene permisos para realizar esta operación.';
      } else if (error.status === 404) {
        errorMessage = 'Código QR no reconocido o estudiante no registrado.';
      } else if (error.status === 500) {
        errorMessage = 'Error en el servidor. Por favor, intente nuevamente más tarde.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}