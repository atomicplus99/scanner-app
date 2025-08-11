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
      this.logEnvironmentInfo();
      this.checkCameraPermission();
    }
  }

  // Información sobre el entorno de ejecución
  private logEnvironmentInfo(): void {
    console.log('🌐 Información del entorno:');
    console.log('  - Protocolo:', window.location.protocol);
    console.log('  - Host:', window.location.host);
    console.log('  - URL completa:', window.location.href);
    console.log('  - User Agent:', navigator.userAgent);
    console.log('  - MediaDevices disponible:', !!navigator.mediaDevices);
    console.log('  - getUserMedia disponible:', !!(navigator.mediaDevices?.getUserMedia));
    
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      console.warn('⚠️ ADVERTENCIA: Para acceder a la cámara desde otros dispositivos, se necesita HTTPS');
      console.warn('💡 Solución: Configura HTTPS o usa localhost para pruebas');
    }
  }

  // Verificar soporte de MediaDevices
  private checkMediaDevicesSupport(): boolean {
    if (!navigator) {
      console.error('❌ Navigator no disponible');
      return false;
    }

    if (!navigator.mediaDevices) {
      console.error('❌ navigator.mediaDevices no disponible');
      console.warn('💡 Sugerencia: La aplicación debe ejecutarse en HTTPS para acceder a la cámara');
      return false;
    }

    if (!navigator.mediaDevices.getUserMedia) {
      console.error('❌ getUserMedia no disponible');
      return false;
    }

    if (!navigator.mediaDevices.enumerateDevices) {
      console.error('❌ enumerateDevices no disponible');
      return false;
    }

    return true;
  }

  // Método público para reintentar detección de cámaras
  async retryInitialization(): Promise<void> {
    if (!this.isBrowser) return;
    
    console.log('🔄 Reintentando inicialización de cámaras...');
    this.scannerError.set(false);
    this.scannerStatus.set('Detectando cámaras...');
    
    try {
      await this.checkCameraPermission();
      console.log('✅ Reinicialización exitosa');
    } catch (error) {
      console.error('❌ Error en reinicialización:', error);
      this.setErrorStatus('Error al reinicializar cámaras');
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

  private async tryMultipleConstraints(deviceId?: string): Promise<MediaStream> {
    // Verificar soporte de MediaDevices
    if (!this.checkMediaDevicesSupport()) {
      throw new Error('El navegador no soporta acceso a cámara');
    }

    const constraintsList = this.getConstraintsList(deviceId);
    
    let lastError: any = null;
    for (let i = 0; i < constraintsList.length; i++) {
      const constraints = constraintsList[i];
      console.log(`🔄 Intentando configuración ${i + 1}/${constraintsList.length}:`, constraints);

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log(`✅ Configuración ${i + 1} exitosa`);
        return stream;
      } catch (error) {
        console.warn(`❌ Configuración ${i + 1} falló:`, error);
        lastError = error;
        
        // Si no es el último intento, continuar con el siguiente
        if (i < constraintsList.length - 1) {
          this.scannerStatus.set(`Probando configuración ${i + 2}...`);
          continue;
        }
      }
    }

    // Si llegamos aquí, todas las configuraciones fallaron
    throw lastError || new Error('No se pudo acceder a ninguna cámara');
  }

  private getConstraintsList(deviceId?: string): MediaStreamConstraints[] {
    const constraints: MediaStreamConstraints[] = [];
    
    if (!deviceId) {
      // Si no hay deviceId específico, devolver múltiples opciones fallback
      constraints.push(
        // Opción 1: Cámara trasera de alta calidad
        {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 }
          }
        },
        // Opción 2: Cualquier cámara con calidad media
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          }
        },
        // Opción 3: Configuración mínima
        { video: true }
      );
      return constraints;
    }

    // Detectar tipo de cámara
    const cameras = this.availableCameras();
    const selectedCam = cameras.find(cam => cam.deviceId === deviceId);
    const cameraInfo = this.analyzeCameraType(selectedCam);

    console.log(`🎥 Configurando cámara ${cameraInfo.type.toUpperCase()}:`, selectedCam?.label);

    // Opción 1: Configuración optimizada según tipo de cámara
    if (cameraInfo.type === 'front') {
      constraints.push({
        video: {
          deviceId: { exact: deviceId },
          facingMode: 'user',
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          frameRate: { ideal: 30, min: 15 }
        }
      });
    } else if (cameraInfo.type === 'back') {
      constraints.push({
        video: {
          deviceId: { exact: deviceId },
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
    } else {
      // Cámara externa/USB/webcam
      constraints.push({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      });
    }

    // Opción 2: Fallback con deviceId pero sin restricciones de tamaño
    constraints.push({
      video: {
        deviceId: { ideal: deviceId },
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    });

    // Opción 3: Solo deviceId
    constraints.push({
      video: { deviceId: deviceId }
    });

    // Opción 4: Fallback general
    constraints.push({ video: true });

    return constraints;
  }

  private analyzeCameraType(camera?: MediaDeviceInfo): { type: 'front' | 'back' | 'external', confidence: number } {
    if (!camera) return { type: 'external', confidence: 0 };

    const label = camera.label.toLowerCase();
    let type: 'front' | 'back' | 'external' = 'external';
    let confidence = 0;

    // Detectar cámara frontal
    if (label.includes('front') || label.includes('user') || 
        label.includes('frontal') || label.includes('facing front') ||
        label.includes('camera2 1') || label.includes('facetime')) {
      type = 'front';
      confidence = 90;
    }
    // Detectar cámara trasera
    else if (label.includes('back') || label.includes('rear') || 
             label.includes('trasera') || label.includes('environment') ||
             label.includes('camera2 0') || label.includes('main')) {
      type = 'back';
      confidence = 90;
    }
    // Detectar cámaras externas/USB/webcam
    else if (label.includes('usb') || label.includes('webcam') || 
             label.includes('external') || label.includes('integrated') ||
             label.includes('built-in') || label.includes('logitech') ||
             label.includes('microsoft')) {
      type = 'external';
      confidence = 80;
    }
    // Heurística por posición en lista
    else {
      const cameras = this.availableCameras();
      const index = cameras.findIndex(c => c.deviceId === camera.deviceId);
      if (index === 0) {
        type = 'back'; // Primera cámara suele ser trasera en móviles
        confidence = 30;
      } else if (index === 1) {
        type = 'front'; // Segunda cámara suele ser frontal
        confidence = 30;
      }
    }

    return { type, confidence };
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

      // Intentar múltiples configuraciones con fallbacks
      this.controlStream = await this.tryMultipleConstraints(this.selectedCamera());

      // Verificar capacidades de la cámara
      const videoTrack = this.controlStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities() as any;
        this.hasTorch.set('torch' in capabilities);
        
        // Logs informativos sobre la cámara
        const settings = videoTrack.getSettings();
        console.log('📷 Cámara configurada:', {
          deviceId: settings.deviceId,
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
          facingMode: settings.facingMode,
          hasTorch: 'torch' in capabilities
        });
      }

      // Asignar stream al video
      videoElement.srcObject = this.controlStream;

      try {
        await videoElement.play();

        // Esperar a que se carguen los metadatos del video
        const setupVideo = () => {
          if (videoElement.videoWidth && videoElement.videoHeight) {
            this.videoWidth.set(videoElement.videoWidth);
            this.videoHeight.set(videoElement.videoHeight);

            // Configurar canvas con las dimensiones del video
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;

            console.log(`📐 Video configurado: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
            
            // Iniciar escaneo después de un breve delay
            setTimeout(() => {
              this.startJsQrScanner(videoElement, canvasElement);
            }, 500);
          } else {
            // Si los metadatos no están listos, esperar
            videoElement.onloadedmetadata = setupVideo;
          }
        };

        setupVideo();

        this.isScanning.set(true);
        this.scannerStatus.set('Listo para escanear');
      } catch (playError) {
        console.error('Error al reproducir video:', playError);
        this.setErrorStatus('Error al iniciar la reproducción de video');
      }
    } catch (error: any) {
      console.error('Error al iniciar el escáner:', error);
      
      // Mensaje de error más específico
      let errorMessage = 'Error al acceder a la cámara';
      if (error?.name === 'NotAllowedError') {
        errorMessage = 'Permisos de cámara denegados';
      } else if (error?.name === 'NotFoundError') {
        errorMessage = 'No se encontraron cámaras';
      } else if (error?.name === 'NotReadableError') {
        errorMessage = 'Cámara en uso por otra aplicación';
      } else if (error?.name === 'OverconstrainedError') {
        errorMessage = 'Configuración de cámara no soportada';
      }
      
      this.setErrorStatus(errorMessage);
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

    // Verificar soporte primero
    if (!this.checkMediaDevicesSupport()) {
      console.error('❌ No se pueden enumerar cámaras: MediaDevices no soportado');
      return;
    }

    try {
      // Primero solicitar permisos para obtener etiquetas completas
      await this.requestCameraPermissionForLabels();
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      console.log('📹 Cámaras detectadas:', videoDevices.map(d => ({
        id: d.deviceId,
        label: d.label,
        kind: d.kind
      })));

      this.availableCameras.set(videoDevices);

      if (videoDevices.length > 0) {
        // Prioridad de selección de cámara mejorada
        const selectedCamera = this.selectBestCamera(videoDevices);
        this.selectedCamera.set(selectedCamera);
        
        console.log('🎯 Cámara seleccionada por defecto:', 
          videoDevices.find(d => d.deviceId === selectedCamera)?.label || selectedCamera);
      }
    } catch (error) {
      console.error('Error al enumerar cámaras:', error);
      this.setErrorStatus('Error al detectar cámaras disponibles');
    }
  }

  private async requestCameraPermissionForLabels(): Promise<void> {
    try {
      // Solicitar permisos temporalmente para obtener etiquetas de dispositivos
      const tempStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      tempStream.getTracks().forEach(track => track.stop());
    } catch (error) {
      // Intentar con configuración más básica
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach(track => track.stop());
      } catch (fallbackError) {
        console.warn('No se pudieron obtener permisos para etiquetas de cámara:', fallbackError);
      }
    }
  }

  private selectBestCamera(videoDevices: MediaDeviceInfo[]): string {
    if (videoDevices.length === 0) return '';

    // Función para evaluar el score de una cámara
    const getCameraScore = (device: MediaDeviceInfo): number => {
      const label = device.label.toLowerCase();
      let score = 0;

      // Priorizar cámaras traseras/environment
      if (label.includes('back') || label.includes('rear') || 
          label.includes('trasera') || label.includes('environment')) {
        score += 100;
      }

      // Priorizar cámaras principales/primary
      if (label.includes('main') || label.includes('primary') || 
          label.includes('principal') || label.includes('0')) {
        score += 50;
      }

      // Evitar cámaras frontales como primera opción
      if (label.includes('front') || label.includes('user') || 
          label.includes('frontal') || label.includes('1')) {
        score -= 30;
      }

      // Priorizar cámaras con mejor resolución (si está en el nombre)
      if (label.includes('hd') || label.includes('1080') || label.includes('720')) {
        score += 20;
      }

      // Para laptops/PCs, priorizar cámaras integradas
      if (label.includes('integrated') || label.includes('built-in') || 
          label.includes('webcam') || label.includes('usb')) {
        score += 30;
      }

      return score;
    };

    // Ordenar cámaras por score y seleccionar la mejor
    const sortedCameras = videoDevices
      .map(device => ({
        device,
        score: getCameraScore(device)
      }))
      .sort((a, b) => b.score - a.score);

    console.log('📊 Ranking de cámaras:', sortedCameras.map(c => ({
      label: c.device.label,
      score: c.score,
      id: c.device.deviceId.substring(0, 8) + '...'
    })));

    return sortedCameras[0].device.deviceId;
  }

  async onCameraChange(deviceId: string, videoElement?: HTMLVideoElement, canvasElement?: HTMLCanvasElement): Promise<void> {
    this.selectedCamera.set(deviceId);

    // Si el scanner está activo, reiniciar con nueva cámara
    if (this.isScanning()) {
      this.stopScanner();

      // Esperar un momento y reiniciar con nueva cámara
      setTimeout(async () => {
        if (videoElement && canvasElement) {
          await this.startScanner(videoElement, canvasElement);
        }
      }, 300);
    }
  }

  // MÉTODOS PRIVADOS

  private loadSounds(): void {
    this.scanSuccessSound = new Audio('assets/sounds/beep-succes.mp3');
    this.scanSuccessSound.preload = 'auto';

    this.scanErrorSound = new Audio('assets/sounds/beep-error.mp3');
    this.scanErrorSound.preload = 'auto';
  }

  private async checkCameraPermission(): Promise<void> {
    if (!this.isBrowser) return;

    // Verificar soporte de MediaDevices primero
    if (!this.checkMediaDevicesSupport()) {
      this.setErrorStatus('El navegador no soporta acceso a cámara. Usa HTTPS o un navegador compatible.');
      return;
    }

    try {
      // Verificar si existe la API de permisos
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('🔐 Estado de permisos de cámara:', permission.state);
        
        if (permission.state === 'denied') {
          this.setErrorStatus('Permisos de cámara denegados. Habilitarlos en configuración del navegador.');
          return;
        }
      }

      // Intentar acceso temporal para verificar permisos y listar cámaras
      console.log('🔍 Verificando acceso a cámara...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        } 
      });
      
      // Verificar que el stream es válido
      if (stream && stream.getVideoTracks().length > 0) {
        console.log('✅ Acceso a cámara confirmado');
        stream.getTracks().forEach(track => track.stop());
        
        // Ahora enumerar todas las cámaras disponibles
        await this.listAvailableCameras();
      } else {
        throw new Error('Stream de video no válido');
      }
    } catch (error: any) {
      console.error('❌ Error de permisos de cámara:', error);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al acceder a la cámara';
      
      if (error?.name === 'NotAllowedError') {
        errorMessage = 'Permisos de cámara denegados. Habilítarlos en el navegador.';
      } else if (error?.name === 'NotFoundError') {
        errorMessage = 'No se detectaron cámaras en este dispositivo';
      } else if (error?.name === 'NotSupportedError') {
        errorMessage = 'El navegador no soporta acceso a cámara';
      } else if (error?.name === 'NotReadableError') {
        errorMessage = 'Cámara en uso por otra aplicación';
      }
      
      this.scannerStatus.set(errorMessage);
      
      // Intentar al menos enumerar dispositivos sin stream (sin etiquetas)
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length > 0) {
          console.log(`📹 Se detectaron ${videoDevices.length} dispositivos de video (sin etiquetas)`);
          this.availableCameras.set(videoDevices);
          this.selectedCamera.set(videoDevices[0].deviceId);
        }
      } catch (enumError) {
        console.error('Error al enumerar dispositivos:', enumError);
      }
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
        this.scannerStatus.set('✅ Código QR procesado correctamente');

        // CAMBIO: Reiniciar después de mostrar éxito (igual que en error)
        setTimeout(() => {
          if (this.isScanning()) {
            this.scannerStatus.set('Listo para escanear...');
          }
        }, 2000); // Reducido a 2 segundos
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
          tipo: 'entrada',
          status: 'error',
          estado: 'ERROR',
          mensaje: errorMessage,
          imgProfile: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`)
        };

        // Actualizar la UI con el error
        this.updateRegistros(registro);
        this.scannerStatus.set(`❌ ${errorMessage}`);

        // CAMBIO: Mismo manejo que en éxito - continúa escaneando
        setTimeout(() => {
          if (this.isScanning()) {
            this.scannerStatus.set('Listo para escanear...');
          }
        }, 3000); // Un poco más de tiempo para leer el error
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