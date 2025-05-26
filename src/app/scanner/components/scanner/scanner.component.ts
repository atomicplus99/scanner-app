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
  styleUrls: ['./scanner.component.scss']
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
    // Inicialización retrasada para permitir que la vista se renderice completamente
    setTimeout(() => {
      this.adjustQrRegion();
    }, 100);
  }

  ngOnDestroy(): void {
    this.scannerService.destroy();
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    // Prevenir múltiples ejecuciones durante el redimensionamiento
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = setTimeout(() => {
      if (this.qrRegionElement) {
        this.adjustQrRegion();
      }
    }, 200);
  }
  
  @HostListener('window:orientationchange')
  onOrientationChange(): void {
    // Manejar cambios de orientación específicamente
    setTimeout(() => {
      this.adjustQrRegion();
      
      // Si el escáner estaba activo, reiniciar para ajustar la vista
      if (this.isScanning()) {
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
          
          // Asegurar que el tamaño se ajuste correctamente después de iniciar
          setTimeout(() => {
            this.adjustQrRegion();
          }, 200);
        } catch (error) {
          console.error('Error al iniciar el escáner', error);
        }
      }
    }
  }

  onCameraChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const cameraId = select.value;
    
    this.scannerService.onCameraChange(cameraId);
    
    // Si el escáner está activo, reiniciarlo con la nueva cámara
    if (this.isScanning()) {
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
  }

  toggleTorch(): void {
    this.scannerService.toggleTorch();
  }

  private adjustQrRegion(): void {
    if (!this.qrRegionElement || !this.videoElement?.nativeElement) return;

    const videoEl = this.videoElement.nativeElement;
    const containerEl = this.qrRegionElement.nativeElement;
    const containerWidth = containerEl.parentElement?.clientWidth || window.innerWidth - 32;
    
    // Si el video no tiene dimensiones aún, esperar
    if (!videoEl.videoWidth || !videoEl.videoHeight) {
      videoEl.onloadedmetadata = () => this.adjustQrRegion();
      return;
    }

    const isPortrait = window.innerHeight > window.innerWidth;
    const videoRatio = videoEl.videoHeight / videoEl.videoWidth;

    if (isPortrait) {
      // Modo vertical - optimizar para pantallas estrechas
      const calculatedHeight = Math.min(
        containerWidth * videoRatio,
        window.innerHeight * 0.5
      );
      
      containerEl.style.width = `${containerWidth}px`;
      containerEl.style.height = `${calculatedHeight}px`;
    } else {
      // Modo horizontal - optimizar para pantallas anchas
      const maxHeight = window.innerHeight * 0.6;
      const calculatedHeight = Math.min(containerWidth * videoRatio, maxHeight);
      const calculatedWidth = calculatedHeight / videoRatio;
      
      containerEl.style.width = `${calculatedWidth}px`;
      containerEl.style.height = `${calculatedHeight}px`;
      
      // Centrar horizontalmente si es necesario
      if (calculatedWidth < containerWidth) {
        containerEl.style.margin = '0 auto';
      } else {
        containerEl.style.margin = '0';
      }
    }
  }
}