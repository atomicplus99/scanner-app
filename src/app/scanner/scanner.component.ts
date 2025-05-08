// import { CommonModule } from '@angular/common';
// import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
// import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
// import { isPlatformBrowser } from '@angular/common';
// import { Subject, timer } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';
// import { FormsModule } from '@angular/forms';
// import jsQR from 'jsqr';
// import { DatePipe } from '@angular/common';



// // Interfaces para manejar la respuesta específica del backend
// interface Turno {
//   id_turno: string;
//   hora_inicio: string;
//   hora_fin: string;
//   hora_limite: string;
//   turno: string;
// }

// interface Usuario {
//   id_user: string;
//   nombre_usuario: string;
//   password_user: string;
//   rol_usuario: string;
//   profile_image: string;
// }

// interface Alumno {
//   id_alumno: string;
//   codigo: string;
//   dni_alumno: string;
//   nombre: string;
//   apellido: string;
//   fecha_nacimiento: string;
//   direccion: string;
//   codigo_qr: string;
//   nivel: string;
//   grado: number;
//   seccion: string;
//   turno: Turno;
//   usuario: Usuario;
// }

// interface AsistenciaResponse {
//   mensaje: string;
//   asistencia: {
//     id_asistencia: string;
//     hora_de_llegada: string;
//     hora_salida: string | null;
//     estado_asistencia: string;
//     fecha: string;
//     alumno: Alumno;
//   };
// }

// interface Registro {
//   id: string;
//   estudiante: {
//     nombre: string;
//     apellido: string;
//     codigo: string;
//     grado: number;
//     seccion: string;
//     nivel: string;
//   };
//   hora: string;
//   fecha: string;
//   tipo: 'entrada' | 'salida';
//   status: 'success' | 'error';
//   estado: string;
//   mensaje: string;
//   imgProfile?: string;
// }

// @Component({
//   selector: 'app-qr-scanner-demo',
//   standalone: true,
//   imports: [CommonModule, HttpClientModule, FormsModule],
//   templateUrl: './scanner.component.html',
//   styleUrls: ['./scanner.component.scss']
// })
// export class QrScannerComponent implements OnInit, OnDestroy {
//   @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
//   @ViewChild('canvasElement', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;
//   @ViewChild('qrRegionElement', { static: false }) qrRegionElement!: ElementRef<HTMLDivElement>;

//   // Variables públicas para el template
//   videoWidth = 640;
//   videoHeight = 480;
//   torchEnabled = false;
//   captureInProgress = false;

//   private http = inject(HttpClient);
//   private destroy$ = new Subject<void>();
//   private apiUrl = 'http://localhost:3000/asistencia/scan';
//   private isBrowser: boolean;
//   private controlStream: MediaStream | null = null;
//   private changeDetectorRef = inject(ChangeDetectorRef);
//   private scanningInterval: any = null;
//   private scanSuccessSound: HTMLAudioElement | null = null;
//   private scanErrorSound: HTMLAudioElement | null = null;
//   private lastProcessedCode: string | null = null;
//   private lastProcessedTime = 0;
//   private serverUrl = 'http://localhost:3000';

//   // Signals
//   darkMode = signal<boolean>(false);
//   isScanning = signal<boolean>(false);
//   scannerStatus = signal<string>('Esperando inicio del escáner');
//   scannerError = signal<boolean>(false);
//   lastScanResult = signal<Registro | null>(null);
//   registrosRecientes = signal<Registro[]>([]);
//   showDetailsModal = signal<boolean>(false);
//   selectedRegistro = signal<Registro | null>(null);
//   // Nuevas señales para las cámaras
//   availableCameras = signal<MediaDeviceInfo[]>([]);
//   selectedCamera = signal<string>('');
//   hasTorch = signal<boolean>(false);

//   constructor(@Inject(PLATFORM_ID) platformId: Object) {
//     this.isBrowser = isPlatformBrowser(platformId);

//     // Detectar preferencia de tema del sistema
//     if (this.isBrowser) {
//       const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//       this.darkMode.set(prefersDark);

//       // Cargar sonidos
//       this.loadSounds();
//     }
//   }

//   /**
//    * Inicializa y aplica el tema al cargar el componente
//    */
//   ngOnInit(): void {
//     if (!this.isBrowser) {
//       return;
//     }

//     // Comprobar acceso a la cámara y listar las disponibles
//     this.checkCameraPermission();
//     this.listAvailableCameras();

//     // Inicializar el tema basado en las preferencias del sistema
//     const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//     this.darkMode.set(prefersDark);

//     // Aplicar el tema al body
//     if (prefersDark) {
//       document.body.classList.add('dark-theme-body');
//     } else {
//       document.body.classList.remove('dark-theme-body');
//     }

//     // Manejar cambios de orientación de pantalla
//     window.addEventListener('resize', this.onWindowResize.bind(this));
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();

//     if (this.isScanning()) {
//       this.stopScanner();
//     }

//     // Remover listener de resize
//     window.removeEventListener('resize', this.onWindowResize.bind(this));
//   }

//   /**
//    * Carga los sonidos para feedback auditivo
//    */
//   private loadSounds(): void {
//     // Sonido de éxito (beep)
//     this.scanSuccessSound = new Audio('assets/sounds/success-beep.mp3');
//     this.scanSuccessSound.preload = 'auto';

//     // Sonido de error
//     this.scanErrorSound = new Audio('assets/sounds/error-beep.mp3');
//     this.scanErrorSound.preload = 'auto';
//   }

//   /**
//    * Maneja el cambio de tamaño de la ventana
//    */
//   private onWindowResize(): void {
//     if (this.isScanning() && this.videoElement && this.qrRegionElement) {
//       // Ajustar el tamaño del scanner según la orientación
//       this.adjustQrRegion();
//     }
//   }

//   /**
//    * Ajusta la región de escaneo en base al tamaño disponible
//    */
//   private adjustQrRegion(): void {
//     if (!this.qrRegionElement || !this.videoElement) return;

//     const videoEl = this.videoElement.nativeElement;
//     const containerEl = this.qrRegionElement.nativeElement;
//     const containerWidth = containerEl.clientWidth;

//     const isPortrait = window.innerHeight > window.innerWidth;

//     // Calcular el tamaño adecuado para el video (mantener relación de aspecto)
//     if (isPortrait) {
//       // Modo vertical - usar el ancho completo
//       const aspectRatio = videoEl.videoHeight / videoEl.videoWidth;
//       const height = containerWidth * aspectRatio;

//       containerEl.style.width = `${containerWidth}px`;
//       containerEl.style.height = `${height}px`;
//     } else {
//       // Modo horizontal - ajustar altura
//       const aspectRatio = videoEl.videoWidth / videoEl.videoHeight;
//       const height = Math.min(containerWidth / aspectRatio, window.innerHeight * 0.6);
//       const width = height * aspectRatio;

//       containerEl.style.width = `${width}px`;
//       containerEl.style.height = `${height}px`;
//     }

//     // Forzar detección de cambios
//     this.changeDetectorRef.detectChanges();
//   }

//   toggleTheme(): void {
//     this.darkMode.update(value => {
//       const newValue = !value;
//       // Aplicar el tema al document body
//       if (newValue) {
//         document.body.classList.add('dark-theme-body');
//       } else {
//         document.body.classList.remove('dark-theme-body');
//       }
//       return newValue;
//     });
//   }

//   /**
//    * Maneja el cambio de cámara seleccionada
//    * @param event Evento del selector de cámara
//    */
//   onCameraChange(event: Event): void {
//     const select = event.target as HTMLSelectElement;
//     this.selectedCamera.set(select.value);

//     // Si el escáner está activo, reiniciarlo con la nueva cámara
//     if (this.isScanning()) {
//       this.stopScanner();
//       this.startScanner();
//     }
//   }

//   /**
//    * Activa o desactiva la linterna si está disponible
//    */
//   toggleTorch(): void {
//     if (!this.controlStream) return;

//     const videoTrack = this.controlStream.getVideoTracks()[0];
//     const capabilities = videoTrack.getCapabilities() as any;

//     if (!('torch' in capabilities)) {
//       console.log('Linterna no disponible en este dispositivo');
//       return;
//     }

//     this.torchEnabled = !this.torchEnabled;

//     try {
//       // Aplicar las restricciones usando 'advanced' correctamente tipado
//       videoTrack.applyConstraints({
//         advanced: [{ torch: this.torchEnabled } as MediaTrackConstraintSet] // Corrección: Añadir as MediaTrackConstraintSet
//       }).then(() => {
//         console.log(`Linterna ${this.torchEnabled ? 'activada' : 'desactivada'}`);
//       }).catch(err => {
//         console.error('Error al cambiar el estado de la linterna:', err);
//       });
//     } catch (err) {
//       console.error('Error al acceder a la linterna:', err);
//     }
//   }


//   /**
//    * Activa o desactiva el escáner
//    */
//   async toggleScanner(): Promise<void> {
//     if (this.isScanning()) {
//       this.stopScanner();
//     } else {
//       await this.startScanner();
//     }
//   }

//   /**
//    * Inicia la cámara y el proceso de escaneo
//    */
//   async startScanner(): Promise<void> {
//     if (!this.isBrowser || !this.videoElement || !this.canvasElement) {
//       this.setErrorStatus('No se puede acceder a la cámara en este entorno');
//       return;
//     }

//     try {
//       this.scannerStatus.set('Iniciando cámara...');
//       this.scannerError.set(false);

//       try {
//         // Liberar cualquier stream anterior
//         if (this.controlStream) {
//           this.controlStream.getTracks().forEach(track => track.stop());
//         }

//         // Configurar las restricciones de video para la cámara seleccionada
//         let constraints: MediaStreamConstraints = {
//           video: {
//             width: { ideal: 1280 },
//             height: { ideal: 720 },
//             facingMode: 'environment', // Preferir cámara trasera como respaldo
//           }
//         };

//         // Si hay una cámara seleccionada, usarla
//         if (this.selectedCamera()) {
//           constraints = {
//             video: {
//               width: { ideal: 1280 },
//               height: { ideal: 720 },
//               deviceId: { exact: this.selectedCamera() }
//             }
//           };
//         }

//         console.log('Usando restricciones de cámara:', constraints);

//         // Obtener acceso a la cámara
//         this.controlStream = await navigator.mediaDevices.getUserMedia(constraints);

//         // Verificar si la cámara tiene linterna
//         const videoTrack = this.controlStream.getVideoTracks()[0];
//         const capabilities = videoTrack.getCapabilities() as any; // Corrección: Añadir 'as any' o interfaz

//         this.hasTorch.set(!!('torch' in capabilities)); // Corrección: Comprobar con 'in'
//         // Asignar el stream a la etiqueta de video
//         this.videoElement.nativeElement.srcObject = this.controlStream;

//         // Asegurarse de que el video se esté reproduciendo
//         try {
//           await this.videoElement.nativeElement.play();
//           console.log('La cámara se ha iniciado correctamente');

//           // Registrar el tamaño del video y ajustar región
//           this.videoElement.nativeElement.onloadedmetadata = () => {
//             this.videoWidth = this.videoElement.nativeElement.videoWidth;
//             this.videoHeight = this.videoElement.nativeElement.videoHeight;
//             console.log(`Resolución de video: ${this.videoWidth}x${this.videoHeight}`);

//             // Establecer el tamaño del canvas para coincidir con el video
//             const canvas = this.canvasElement.nativeElement;
//             canvas.width = this.videoWidth;
//             canvas.height = this.videoHeight;

//             // Ajustar la región de escaneo
//             this.adjustQrRegion();

//             // Forzar detección de cambios para actualizar el template
//             this.changeDetectorRef.detectChanges();
//           };

//         } catch (playError) {
//           console.error('Error al reproducir el video:', playError);
//           this.setErrorStatus('Error al iniciar la cámara. Intente nuevamente.');
//           return;
//         }

//         // Iniciar el escaneo continuo después de un pequeño retraso para que la cámara se estabilice
//         setTimeout(() => {
//           this.startJsQrScanner();
//         }, 1000);

//         this.isScanning.set(true);
//         this.scannerStatus.set('Listo para escanear');
//       } catch (mediaError) {
//         console.error('Error al acceder a la cámara:', mediaError);
//         this.setErrorStatus('No se pudo acceder a la cámara. Verifique permisos.');
//       }
//     } catch (error) {
//       console.error('Error al iniciar el escáner:', error);
//       this.setErrorStatus('Error al iniciar la cámara. Verifique los permisos.');
//     }
//   }
//   retryConnection(maxRetries: number = 3): Promise<boolean> {
//     return new Promise((resolve) => {
//       let retries = 0;

//       const attemptConnection = () => {
//         if (retries >= maxRetries) {
//           this.scannerStatus.set('No se pudo conectar al servidor después de varios intentos');
//           resolve(false);
//           return;
//         }

//         this.scannerStatus.set(`Intentando reconectar (${retries + 1}/${maxRetries})...`);

//         // Hacer una petición simple para verificar la conexión
//         this.http.get(this.serverUrl + '/ping', { responseType: 'text' })
//           .subscribe({
//             next: () => {
//               this.scannerStatus.set('Conexión restablecida');
//               resolve(true);
//             },
//             error: () => {
//               retries++;
//               setTimeout(attemptConnection, 2000);  // Intentar nuevamente después de 2 segundos
//             }
//           });
//       };

//       attemptConnection();
//     });
//   }

//   checkServerStatus(): void {
//     this.http.get(this.serverUrl + '/ping', { responseType: 'text' })
//       .subscribe({
//         next: () => {
//           console.log('Conexión con el servidor establecida');
//         },
//         error: (error) => {
//           console.error('Error al conectar con el servidor:', error);
//           this.setErrorStatus('No se pudo conectar con el servidor. Verifique su conexión a internet.');
//         }
//       });
//   }

//   showErrorMessage(message: string, duration: number = 5000): void {
//     // Implementar un sistema de notificaciones en la UI
//     // Esto podría ser un banner o toast notification
//     this.scannerError.set(true);
//     this.scannerStatus.set(message);

//     // Limpiar el estado de error después de un tiempo
//     setTimeout(() => {
//       if (this.scannerStatus() === message) {
//         this.scannerError.set(false);
//         this.scannerStatus.set('Listo para escanear');
//       }
//     }, duration);
//   }

//   /**
//    * Método para iniciar el escaneo con jsQR
//    */
//   private startJsQrScanner(): void {
//     if (!this.isScanning() || !this.videoElement || !this.canvasElement) return;

//     // Limpiar cualquier intervalo previo
//     if (this.scanningInterval) {
//       clearInterval(this.scanningInterval);
//     }

//     const canvas = this.canvasElement.nativeElement;
//     const ctx = canvas.getContext('2d', { willReadFrequently: true });

//     if (!ctx) {
//       this.setErrorStatus('No se pudo crear el contexto de canvas');
//       return;
//     }

//     // Crear un intervalo para escanear continuamente
//     this.scanningInterval = setInterval(() => {
//       if (!this.isScanning() || this.captureInProgress) {
//         if (!this.isScanning()) {
//           clearInterval(this.scanningInterval);
//         }
//         return;
//       }

//       // Marcar que estamos procesando un frame
//       this.captureInProgress = true;

//       try {
//         // Dibujar el frame actual del video en el canvas
//         ctx.drawImage(
//           this.videoElement.nativeElement,
//           0, 0,
//           canvas.width,
//           canvas.height
//         );

//         // Obtener los datos de imagen
//         const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

//         // Escanear el código QR con jsQR
//         const code = jsQR(imageData.data, imageData.width, imageData.height, {
//           inversionAttempts: "dontInvert", // Intenta mejorar el rendimiento
//         });

//         if (code) {
//           console.log('QR detectado:', code.data);

//           // Verificar si es un código diferente o ha pasado suficiente tiempo
//           const currentTime = Date.now();
//           const timeSinceLastScan = currentTime - this.lastProcessedTime;

//           // Solo procesar si es un código diferente o han pasado al menos 5 segundos
//           if (code.data !== this.lastProcessedCode || timeSinceLastScan > 5000) {
//             // Reproducir sonido de éxito
//             if (this.scanSuccessSound) {
//               this.scanSuccessSound.play().catch(err => console.log('No se pudo reproducir el sonido', err));
//             }

//             // Actualizar variables de control
//             this.lastProcessedCode = code.data;
//             this.lastProcessedTime = currentTime;

//             // Procesar el código QR encontrado
//             this.processQrCode(code.data);

//             // Breve pausa después de escanear para evitar escanear el mismo código varias veces
//             clearInterval(this.scanningInterval);
//             this.pauseScanner();
//             timer(3000)
//               .pipe(takeUntil(this.destroy$))
//               .subscribe(() => {
//                 if (this.isScanning()) {
//                   this.scannerStatus.set('Listo para escanear...');
//                   this.startJsQrScanner(); // Reiniciar el escaneo después de la pausa
//                 }
//               });
//           }
//         }
//       } catch (error) {
//         console.error('Error al escanear con jsQR:', error);
//       } finally {
//         // Marcar que hemos terminado de procesar este frame
//         this.captureInProgress = false;
//       }
//     }, 200); // Escanear cada 200ms
//   }

//   /**
//    * Detiene el escaneo y libera recursos
//    */
//   stopScanner(): void {
//     if (this.isBrowser) {
//       // Detener el intervalo de escaneo
//       if (this.scanningInterval) {
//         clearInterval(this.scanningInterval);
//         this.scanningInterval = null;
//       }

//       // Apagar la linterna si está encendida
//       if (this.torchEnabled && this.controlStream) {
//         const videoTrack = this.controlStream.getVideoTracks()[0];
//         const capabilities = videoTrack.getCapabilities() as any; // Añadir esto
//         if ('torch' in capabilities) { // Modificar esto
//           videoTrack.applyConstraints({
//             advanced: [{ torch: false } as MediaTrackConstraintSet] //Añadir esto
//           }).catch(err => console.error('Error al apagar la linterna:', err));
//         }
//         this.torchEnabled = false;
//       }

//       // Detener el stream de la cámara
//       if (this.controlStream) {
//         this.controlStream.getTracks().forEach(track => track.stop());
//         this.controlStream = null;
//       }

//       // Limpiar el video
//       if (this.videoElement?.nativeElement) {
//         this.videoElement.nativeElement.srcObject = null;
//       }

//       this.isScanning.set(false);
//       this.scannerStatus.set('Escáner detenido');
//     }
//   }


//   /**
//    * Pausa temporalmente el escáner
//    */
//   pauseScanner(): void {
//     if (this.isBrowser && this.isScanning()) {
//       this.scannerStatus.set('Procesando código QR...');
//     }
//   }

//   /**
//    * Reanuda el escáner después de una pausa
//    */
//   resumeScanner(): void {
//     if (this.isBrowser && this.isScanning()) {
//       this.scannerStatus.set('Listo para escanear');
//     }
//   }

//   /**
//    * Verifica permisos de cámara y los solicita si es necesario
//    */
//   async checkCameraPermission(): Promise<void> {
//     if (!this.isBrowser) return;

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       // Liberar la cámara después de probar
//       stream.getTracks().forEach(track => track.stop());

//       // Listar cámaras disponibles
//       this.listAvailableCameras();
//     } catch (error) {
//       console.error('Error al solicitar permisos de cámara:', error);
//       this.setErrorStatus('No hay acceso a la cámara. Por favor, conceda permisos.');
//     }
//   }

//   /**
//    * Enumera las cámaras disponibles en el dispositivo
//    */
//   async listAvailableCameras(): Promise<void> {
//     if (!this.isBrowser) return;

//     try {
//       const devices = await navigator.mediaDevices.enumerateDevices();
//       const videoDevices = devices.filter(device => device.kind === 'videoinput');

//       this.availableCameras.set(videoDevices);

//       // Seleccionar la primera cámara por defecto (cámara principal)
//       if (videoDevices.length > 0) {
//         // Intentar encontrar la cámara integrada de la laptop por nombre
//         const laptopCamera = videoDevices.find(
//           device => device.label.toLowerCase().includes('integrated') ||
//             device.label.toLowerCase().includes('built-in') ||
//             device.label.toLowerCase().includes('laptop') ||
//             device.label.toLowerCase().includes('internal')
//         );

//         // En móviles, buscar cámara trasera
//         const backCamera = videoDevices.find(
//           device => device.label.toLowerCase().includes('back') ||
//             device.label.toLowerCase().includes('trasera') ||
//             device.label.toLowerCase().includes('trasero') ||
//             device.label.toLowerCase().includes('rear')
//         );

//         // Priorizar cámara trasera para móviles, luego cámara integrada para laptops o la primera cámara disponible
//         this.selectedCamera.set(
//           backCamera ? backCamera.deviceId :
//             laptopCamera ? laptopCamera.deviceId :
//               videoDevices[0].deviceId
//         );
//       }
//     } catch (error) {
//       console.error('Error al enumerar dispositivos:', error);
//     }
//   }

//   /**
//    * Procesa el código QR y envía la información al servidor
//    * @param qrCode Código QR decodificado
//    */
//   processQrCode(qrCode: string): void {
//     this.scannerStatus.set('Enviando datos...');

//     this.http.post<AsistenciaResponse>(this.apiUrl, { codigo_qr: qrCode })
//       .subscribe({
//         next: (response) => {
//           // El código existente para manejar respuestas exitosas...
//           const registro: Registro = {
//             id: response.asistencia.id_asistencia,
//             estudiante: {
//               nombre: response.asistencia.alumno.nombre,
//               apellido: response.asistencia.alumno.apellido,
//               codigo: response.asistencia.alumno.codigo,
//               grado: response.asistencia.alumno.grado,
//               seccion: response.asistencia.alumno.seccion,
//               nivel: response.asistencia.alumno.nivel
//             },
//             hora: response.asistencia.hora_de_llegada,
//             fecha: this.formatDate(response.asistencia.fecha),
//             tipo: response.asistencia.hora_salida ? 'salida' : 'entrada',
//             status: 'success',
//             estado: response.asistencia.estado_asistencia,
//             mensaje: response.mensaje,
//             imgProfile: this.getImageUrl(response.asistencia.alumno.usuario.profile_image)
//           };

//           this.updateRegistros(registro);
//           this.scannerStatus.set('Código QR procesado correctamente');
//         },
//         error: (error: HttpErrorResponse) => {
//           console.error('Error al procesar código QR:', error);

//           // Reproducir sonido de error
//           if (this.scanErrorSound) {
//             this.scanErrorSound.play().catch(err => console.log('No se pudo reproducir el sonido', err));
//           }

//           // Determinar el mensaje de error específico según el tipo de error
//           let errorMessage = 'Error desconocido al procesar el código QR';

//           if (error.error && typeof error.error === 'object') {
//             // Error con respuesta estructurada del backend
//             const errorResponse = error.error as HttpErrorResponse;
//             errorMessage = errorResponse.message || 'Error al procesar el código QR';
//           } else if (error.status === 0) {
//             // Error de conexión - sin respuesta del servidor
//             errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
//           } else if (error.status === 401) {
//             // Error de autorización
//             errorMessage = 'No tiene permisos para realizar esta operación.';
//           } else if (error.status === 404) {
//             // Recurso no encontrado
//             errorMessage = 'Código QR no reconocido o no está registrado en el sistema.';
//           } else if (error.status === 500) {
//             // Error interno del servidor
//             errorMessage = 'Error en el servidor. Por favor, intente nuevamente más tarde.';
//           } else if (error.status === 400) {
//             // Error de validación o solicitud incorrecta
//             errorMessage = 'Solicitud incorrecta. El código QR podría ser inválido.';
//           } else if (error.status === 408 || error.status === 504) {
//             // Timeout
//             errorMessage = 'La conexión con el servidor ha expirado. Intente nuevamente.';
//           }

//           // Crear un registro de error con la información disponible
//           const registro: Registro = {
//             id: 'error-' + Date.now(),  // ID único para errores
//             estudiante: {
//               nombre: 'Error',
//               apellido: '',
//               codigo: '',
//               grado: 0,
//               seccion: '',
//               nivel: ''
//             },
//             hora: new Date().toLocaleTimeString(),
//             fecha: new Date().toLocaleDateString(),
//             tipo: 'entrada',
//             status: 'error',
//             estado: 'ERROR',
//             mensaje: errorMessage,
//             imgProfile: 'assets/images/error-icon.png'  // Considera usar un icono específico para errores
//           };

//           this.updateRegistros(registro);
//           this.scannerStatus.set(errorMessage);

//           // Reiniciar el escáner después de un tiempo
//           setTimeout(() => {
//             if (this.isScanning()) {
//               this.scannerStatus.set('Listo para escanear');
//               // Reanudar escaneo si estaba activo
//               this.startJsQrScanner();
//             }
//           }, 3000);
//         }
//       });
//   }

//   /**
//    * Actualiza la lista de registros con un nuevo registro
//    * @param registro Nuevo registro a añadir
//    */
//   updateRegistros(registro: Registro): void {
//     // Actualizar el último resultado
//     this.lastScanResult.set(registro);

//     // Actualizar el historial de registros (máximo 20)
//     this.registrosRecientes.update(registros => {
//       const newRegistros = [registro, ...registros];
//       return newRegistros.slice(0, 20);
//     });
//   }

//   /**
//    * Muestra detalles de un registro específico
//    * @param registro Registro a mostrar
//    */
//   showDetails(registro: Registro): void {
//     this.selectedRegistro.set(registro);
//     this.showDetailsModal.set(true);
//   }

//   /**
//    * Cierra el modal de detalles
//    */
//   closeDetailsModal(): void {
//     this.showDetailsModal.set(false);
//   }

//   /**
//    * Formatea una fecha ISO a formato local
//    * @param isoDate Fecha en formato ISO
//    * @returns Fecha formateada
//    */
//   formatDate(isoDate: string): string {
//     try {
//       const date = new Date(isoDate);
//       return date.toLocaleDateString();
//     } catch (e) {
//       return isoDate;
//     }
//   }

//   /**
//    * Obtiene la URL completa de una imagen de perfil
//    * @param imagePath Ruta relativa de la imagen
//    * @returns URL completa
//    */
//   getImageUrl(imagePath: string): string {
//     if (!imagePath) return 'assets/images/user-default.png';

//     if (imagePath.startsWith('http')) {
//       return imagePath;
//     }

//     return `${this.serverUrl}/${imagePath}`;
//   }

//   /**
//    * Obtiene un color de estado basado en el estado de asistencia
//    * @param estado Estado de asistencia
//    * @returns Clase CSS
//    */
//   getEstadoClass(estado: string): string {
//     switch (estado.toUpperCase()) {
//       case 'PUNTUAL':
//         return 'estado-puntual';
//       case 'TARDANZA':
//         return 'estado-tardanza';
//       case 'FALTA':
//         return 'estado-falta';
//       case 'ERROR':
//         return 'estado-error';
//       default:
//         return '';
//     }
//   }

//   /**
//    * Obtiene la hora actual
//    * @returns Hora actual formateada
//    */
//   getCurrentTime(): string {
//     return new Date().toLocaleTimeString();
//   }

//   /**
//    * Establece un estado de error
//    * @param message Mensaje de error
//    */
//   setErrorStatus(message: string): void {
//     this.scannerStatus.set(message);
//     this.scannerError.set(true);
//     this.isScanning.set(false);
//   }

 

// }