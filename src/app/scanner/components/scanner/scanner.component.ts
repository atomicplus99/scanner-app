// src/app/components/scanner/scanner.component.ts
import { Component, ViewChild, ElementRef, OnInit, OnDestroy, inject, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScannerService } from '../../../services/scanner.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scanner.component.html',

})
export class ScannerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('qrRegionElement', { static: false }) qrRegionElement!: ElementRef<HTMLDivElement>;

  private scannerService = inject(ScannerService);
  private themeService = inject(ThemeService);
  
  private resizeTimeout: any = null;

  // Propiedades para plantilla
  get isScanning() { return this.scannerService.isScanning; }
  get scannerStatus() { return this.scannerService.scannerStatus; }
  get scannerError() { return this.scannerService.scannerError; }
  get availableCameras() { return this.scannerService.availableCameras; }
  get selectedCamera() { return this.scannerService.selectedCamera; }
  get hasTorch() { return this.scannerService.hasTorch; }
  get torchEnabled() { return this.scannerService.torchEnabled; }
  get videoWidth() { return this.scannerService.videoWidth; }
  get videoHeight() { return this.scannerService.videoHeight; }
  get darkMode() { return this.themeService.darkMode; }

  ngOnInit(): void {
    this.scannerService.initialize();
  }
  
  ngAfterViewInit(): void {
    // Ya no necesitamos ajustar el QR region - Tailwind maneja el layout
    // Solo verificamos que los elementos estén disponibles
    console.log('Scanner component initialized');
  }

  ngOnDestroy(): void {
    this.scannerService.destroy();
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    // Limpiar timeout anterior
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    // Solo reiniciar el scanner si es necesario para ajustar la cámara
    this.resizeTimeout = setTimeout(() => {
      if (this.isScanning()) {
        console.log('Window resized, scanner active');
        // El video se ajustará automáticamente con las clases de Tailwind
      }
    }, 200);
  }
  
  @HostListener('window:orientationchange')
  onOrientationChange(): void {
    // Manejar cambios de orientación
    setTimeout(() => {
      // Si el escáner estaba activo, reiniciar para ajustar la vista
      if (this.isScanning()) {
        console.log('Orientation changed, restarting scanner');
        this.scannerService.stopScanner();
        setTimeout(() => {
          if (this.videoElement && this.canvasElement) {
            this.scannerService.startScanner(
              this.videoElement.nativeElement,
              this.canvasElement.nativeElement
            );
          }
        }, 300);
      }
    }, 300);
  }

  async toggleScanner(): Promise<void> {
    if (this.isScanning()) {
      this.scannerService.stopScanner();
    } else {
      if (this.videoElement && this.canvasElement) {
        try {
          await this.scannerService.startScanner(
            this.videoElement.nativeElement,
            this.canvasElement.nativeElement
          );
          
          console.log('Scanner started successfully');
          // Ya no necesitamos ajustar manualmente - Tailwind se encarga
        } catch (error) {
          console.error('Error al iniciar el escáner', error);
        }
      }
    }
  }

  async onCameraChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const cameraId = select.value;
    
    // Usar el nuevo método mejorado del service que maneja todo automáticamente
    await this.scannerService.onCameraChange(
      cameraId, 
      this.videoElement?.nativeElement, 
      this.canvasElement?.nativeElement
    );
  }


  toggleTorch(): void {
    this.scannerService.toggleTorch();
  }

  async retryInitialization(): Promise<void> {
    await this.scannerService.retryInitialization();
  }

  // MÉTODO SIMPLIFICADO - Ya no modifica estilos, solo logs para debug
  private logVideoInfo(): void {
    if (!this.videoElement?.nativeElement) return;

    const videoEl = this.videoElement.nativeElement;
    
    // Solo log información del video para debugging
    if (videoEl.videoWidth && videoEl.videoHeight) {
      console.log('Video info:', {
        width: videoEl.videoWidth,
        height: videoEl.videoHeight,
        ratio: videoEl.videoWidth / videoEl.videoHeight
      });
    } else {
      videoEl.onloadedmetadata = () => this.logVideoInfo();
    }
  }

  // Método opcional para debug - puedes llamarlo si necesitas información del video
  getVideoInfo(): void {
    this.logVideoInfo();
  }
}