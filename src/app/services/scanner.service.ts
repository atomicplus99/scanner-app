// src/app/services/scanner.service.ts

import { Injectable, signal, inject, PLATFORM_ID, Inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { AsistenciaResponse, Registro } from '../models/registro.model';
import jsQR from 'jsqr';
import { ApiService } from './api.service';
import { Formatters } from '../shared/utils/formatter';


@Injectable({
  providedIn: 'root'
})
export class ScannerService {
  // Inyectar ApiService en lugar de HttpClient directamente
  private apiService = inject(ApiService);
  
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;
  private controlStream: MediaStream | null = null;
  private scanningInterval: any = null;
  private scanSuccessSound: HTMLAudioElement | null = null;
  private scanErrorSound: HTMLAudioElement | null = null;
  private lastProcessedCode: string | null = null;
  private lastProcessedTime = 0;
  private captureInProgress = false;

  // Signals públicos para estado del escáner
  isScanning = signal<boolean>(false);
  scannerStatus = signal<string>('Esperando inicio del escáner');
  scannerError = signal<boolean>(false);
  lastScanResult = signal<Registro | null>(null);
  registrosRecientes = signal<Registro[]>([]);
  availableCameras = signal<MediaDeviceInfo[]>([]);
  selectedCamera = signal<string>('');
  hasTorch = signal<boolean>(false);
  torchEnabled = signal<boolean>(false);
  videoWidth = signal<number>(640);
  videoHeight = signal<number>(480);

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.loadSounds();
      this.checkCameraPermission();
    }
  }

  // Método público para inicializar
  initialize(): void {
    if (this.isBrowser) {
      this.checkCameraPermission();
      this.listAvailableCameras();
    }
  }

  // Método para liberar recursos
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopScanner();
  }

  // MÉTODOS PÚBLICOS
  
  async toggleScanner(videoElement?: HTMLVideoElement, canvasElement?: HTMLCanvasElement): Promise<void> {
    if (this.isScanning()) {
      this.stopScanner();
    } else {
      if (!videoElement || !canvasElement) {
        this.setErrorStatus('Elementos de video o canvas no disponibles');
        return;
      }
      await this.startScanner(videoElement, canvasElement);
    }
  }

  async startScanner(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): Promise<void> {
    if (!this.isBrowser) {
      this.setErrorStatus('No se puede acceder a la cámara en este entorno');
      return;
    }

    try {
      this.scannerStatus.set('Iniciando cámara...');
      this.scannerError.set(false);

      // Liberar stream anterior
      if (this.controlStream) {
        this.controlStream.getTracks().forEach(track => track.stop());
      }

      // Configurar restricciones
      let constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      };

      if (this.selectedCamera()) {
        constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            deviceId: { exact: this.selectedCamera() }
          }
        };
      }

      // Obtener acceso a la cámara
      this.controlStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Verificar si tiene linterna
      const videoTrack = this.controlStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;
      this.hasTorch.set('torch' in capabilities);

      // Asignar stream al video
      videoElement.srcObject = this.controlStream;
      
      try {
        await videoElement.play();
        
        // Registrar tamaño
        videoElement.onloadedmetadata = () => {
          this.videoWidth.set(videoElement.videoWidth);
          this.videoHeight.set(videoElement.videoHeight);
          
          // Establecer canvas
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;
        };
        
        // Iniciar escaneo
        setTimeout(() => {
          this.startJsQrScanner(videoElement, canvasElement);
        }, 1000);

        this.isScanning.set(true);
        this.scannerStatus.set('Listo para escanear');
      } catch (playError) {
        console.error('Error al reproducir video:', playError);
        this.setErrorStatus('Error al iniciar la cámara');
      }
    } catch (error) {
      console.error('Error al iniciar el escáner:', error);
      this.setErrorStatus('Error al acceder a la cámara');
    }
  }

  stopScanner(): void {
    if (!this.isBrowser) return;
    
    // Detener intervalo
    if (this.scanningInterval) {
      clearInterval(this.scanningInterval);
      this.scanningInterval = null;
    }

    // Apagar linterna
    if (this.torchEnabled() && this.controlStream) {
      const videoTrack = this.controlStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;
      if ('torch' in capabilities) {
        videoTrack.applyConstraints({
          advanced: [{ torch: false } as MediaTrackConstraintSet]
        }).catch(err => console.error('Error al apagar linterna:', err));
      }
      this.torchEnabled.set(false);
    }

    // Detener stream
    if (this.controlStream) {
      this.controlStream.getTracks().forEach(track => track.stop());
      this.controlStream = null;
    }

    this.isScanning.set(false);
    this.scannerStatus.set('Escáner detenido');
  }

  toggleTorch(): void {
    if (!this.controlStream) return;

    const videoTrack = this.controlStream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities() as any;

    if (!('torch' in capabilities)) {
      console.log('Linterna no disponible');
      return;
    }

    const newTorchState = !this.torchEnabled();
    
    try {
      videoTrack.applyConstraints({
        advanced: [{ torch: newTorchState } as MediaTrackConstraintSet]
      }).then(() => {
        this.torchEnabled.set(newTorchState);
      }).catch(err => {
        console.error('Error al cambiar linterna:', err);
      });
    } catch (err) {
      console.error('Error al acceder a la linterna:', err);
    }
  }

  async listAvailableCameras(): Promise<void> {
    if (!this.isBrowser) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      this.availableCameras.set(videoDevices);

      if (videoDevices.length > 0) {
        // Buscar cámara trasera o integrada
        const backCamera = videoDevices.find(
          device => device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('trasera') ||
            device.label.toLowerCase().includes('rear')
        );

        const laptopCamera = videoDevices.find(
          device => device.label.toLowerCase().includes('integrated') ||
            device.label.toLowerCase().includes('built-in')
        );

        this.selectedCamera.set(
          backCamera ? backCamera.deviceId :
            laptopCamera ? laptopCamera.deviceId :
              videoDevices[0].deviceId
        );
      }
    } catch (error) {
      console.error('Error al enumerar cámaras:', error);
    }
  }

  onCameraChange(deviceId: string): void {
    this.selectedCamera.set(deviceId);
    
    if (this.isScanning()) {
      this.stopScanner();
      // El componente debe llamar a startScanner después
    }
  }

  // MÉTODOS PRIVADOS

  private loadSounds(): void {
    this.scanSuccessSound = new Audio('assets/sounds/success-beep.mp3');
    this.scanSuccessSound.preload = 'auto';

    this.scanErrorSound = new Audio('assets/sounds/error-beep.mp3');
    this.scanErrorSound.preload = 'auto';
  }

  private async checkCameraPermission(): Promise<void> {
    if (!this.isBrowser) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      this.listAvailableCameras();
    } catch (error) {
      console.error('Error de permisos de cámara:', error);
      this.setErrorStatus('No hay acceso a la cámara');
    }
  }

  private startJsQrScanner(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): void {
    if (!this.isScanning() || !videoElement || !canvasElement) return;

    if (this.scanningInterval) {
      clearInterval(this.scanningInterval);
    }

    const canvas = canvasElement;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      this.setErrorStatus('No se pudo crear contexto de canvas');
      return;
    }

    this.scanningInterval = setInterval(() => {
      if (!this.isScanning() || this.captureInProgress) {
        if (!this.isScanning()) {
          clearInterval(this.scanningInterval);
        }
        return;
      }

      this.captureInProgress = true;

      try {
        ctx.drawImage(
          videoElement,
          0, 0,
          canvas.width,
          canvas.height
        );

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          console.log('QR detectado:', code.data);

          const currentTime = Date.now();
          const timeSinceLastScan = currentTime - this.lastProcessedTime;

          if (code.data !== this.lastProcessedCode || timeSinceLastScan > 5000) {
            if (this.scanSuccessSound) {
              this.scanSuccessSound.play().catch(err => console.log('Error de sonido', err));
            }

            this.lastProcessedCode = code.data;
            this.lastProcessedTime = currentTime;

            this.processQrCode(code.data);

            clearInterval(this.scanningInterval);
            this.pauseScanner();
            timer(3000)
              .pipe(takeUntil(this.destroy$))
              .subscribe(() => {
                if (this.isScanning()) {
                  this.scannerStatus.set('Listo para escanear...');
                  this.startJsQrScanner(videoElement, canvasElement);
                }
              });
          }
        }
      } catch (error) {
        console.error('Error al escanear:', error);
      } finally {
        this.captureInProgress = false;
      }
    }, 200);
  }

  private pauseScanner(): void {
    if (this.isBrowser && this.isScanning()) {
      this.scannerStatus.set('Procesando código QR...');
    }
  }

  private processQrCode(qrCode: string): void {
    this.scannerStatus.set('Enviando datos...');
  
    // Usar ApiService para enviar el código QR
    this.apiService.scanQrCode(qrCode).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        
        // Reproducir sonido de éxito
        if (this.scanSuccessSound) {
          this.scanSuccessSound.play().catch(err => console.log('Error de sonido', err));
        }
        
        // Crear un registro con la respuesta
        const registro: Registro = {
          id: response.asistencia.id_asistencia,
          estudiante: {
            nombre: response.asistencia.alumno.nombre,
            apellido: response.asistencia.alumno.apellido,
            codigo: response.asistencia.alumno.codigo,
            grado: response.asistencia.alumno.grado,
            seccion: response.asistencia.alumno.seccion,
            nivel: response.asistencia.alumno.nivel
          },
          hora: Formatters.formatHoraAsistencia(response.asistencia.hora_de_llegada),
          fecha: Formatters.formatDate(response.asistencia.fecha),
          tipo: response.asistencia.hora_salida ? 'salida' : 'entrada',
          status: 'success',
          estado: response.asistencia.estado_asistencia,
          mensaje: response.mensaje,
          imgProfile: this.getImageUrl(response.asistencia.alumno.usuario.profile_image)
        };
  
        this.updateRegistros(registro);
        this.scannerStatus.set('Código QR procesado correctamente');
      },
      error: (error: any) => {
        console.error('Error al procesar código QR:', error);
  
        // Reproducir sonido de error
        if (this.scanErrorSound) {
          this.scanErrorSound.play().catch(err => console.log('Error de sonido', err));
        }
  
        // Obtener el mensaje de error del servidor si está disponible
        let errorMessage = 'Error desconocido al procesar el código QR';
        if (error.message) {
          errorMessage = error.message;
        }
  
        // Crear un registro de error para mostrar visualmente
        const registro: Registro = {
          id: 'error-' + Date.now(),
          estudiante: {
            nombre: 'Error de validación',
            apellido: '',
            codigo: '',
            grado: 0,
            seccion: '',
            nivel: ''
          },
          hora: Formatters.formatTime(new Date().toISOString()),
          fecha: Formatters.formatDate(new Date().toISOString()),
          tipo: 'entrada', // O 'salida' dependiendo del contexto
          status: 'error',
          estado: 'ERROR',
          mensaje: errorMessage, // Mostrar el mensaje de error del servidor
          imgProfile: 'assets/images/error-icon.png'
        };
  
        // Actualizar la UI con el error
        this.updateRegistros(registro);
        this.scannerStatus.set(errorMessage);
  
        // Reiniciar el escáner después de un tiempo
        setTimeout(() => {
          if (this.isScanning()) {
            this.scannerStatus.set('Listo para escanear');
          }
        }, 4000); // Damos un poco más de tiempo para que el usuario lea el mensaje
      }
    });
  }

  private updateRegistros(registro: Registro): void {
    this.lastScanResult.set(registro);

    this.registrosRecientes.update(registros => {
      const newRegistros = [registro, ...registros];
      return newRegistros.slice(0, 20);
    });
  }

  private setErrorStatus(message: string): void {
    this.scannerStatus.set(message);
    this.scannerError.set(true);
    this.isScanning.set(false);
  }

  // Utilizar ApiService para obtener URLs de imágenes
  getImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/images/user-default.png';

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    return `${this.apiService.getServerUrl()}/${imagePath}`;
  }

  // Añadir métodos de formateo que usan Formatters
  getEstadoClass(estado: string): string {
    switch (estado.toUpperCase()) {
      case 'PUNTUAL':
        return 'asistencia'; // Clase CSS para estado puntual
      case 'TARDANZA':
        return 'tardanza';
      case 'FALTA':
        return 'falta';
      case 'ERROR':
        return 'error';
      default:
        return '';
    }
  }
  
  formatEstado(estado: string): string {
    return Formatters.formatEstado(estado);
  }
  
  formatGradoNivel(nivel: string, grado: number, seccion: string): string {
    return Formatters.formatGradoNivel(nivel, grado, seccion);
  }
  
  formatStudentName(nombre: string, apellido: string): string {
    return Formatters.formatStudentName(nombre, apellido);
  }
}