// src/app/components/scanner/scanner.component.ts
import { Component, ViewChild, ElementRef, OnInit, OnDestroy, inject } from '@angular/core';
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
export class ScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('qrRegionElement', { static: false }) qrRegionElement!: ElementRef<HTMLDivElement>;

  private scannerService = inject(ScannerService);
  private themeService = inject(ThemeService);

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
    
    // Manejar cambios de orientación
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  ngOnDestroy(): void {
    this.scannerService.destroy();
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }

  async toggleScanner(): Promise<void> {
    if (this.isScanning()) {
      this.scannerService.stopScanner();
    } else {
      if (this.videoElement && this.canvasElement) {
        await this.scannerService.startScanner(
          this.videoElement.nativeElement,
          this.canvasElement.nativeElement
        );
        this.adjustQrRegion();
      }
    }
  }

  onCameraChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.scannerService.onCameraChange(select.value);
    
    // Si el escáner está activo, reiniciarlo con la nueva cámara
    if (this.isScanning()) {
      this.scannerService.stopScanner();
      if (this.videoElement && this.canvasElement) {
        this.scannerService.startScanner(
          this.videoElement.nativeElement, 
          this.canvasElement.nativeElement
        );
      }
    }
  }

  toggleTorch(): void {
    this.scannerService.toggleTorch();
  }

  private onWindowResize(): void {
    if (this.isScanning() && this.qrRegionElement) {
      this.adjustQrRegion();
    }
  }

  private adjustQrRegion(): void {
    if (!this.qrRegionElement || !this.videoElement?.nativeElement) return;

    const videoEl = this.videoElement.nativeElement;
    const containerEl = this.qrRegionElement.nativeElement;
    const containerWidth = containerEl.clientWidth;

    const isPortrait = window.innerHeight > window.innerWidth;

    // Calcular tamaño adecuado
    if (isPortrait) {
      // Modo vertical - usar ancho completo
      const aspectRatio = videoEl.videoHeight / videoEl.videoWidth;
      const height = containerWidth * aspectRatio;

      containerEl.style.width = `${containerWidth}px`;
      containerEl.style.height = `${height}px`;
    } else {
      // Modo horizontal - ajustar altura
      const aspectRatio = videoEl.videoWidth / videoEl.videoHeight;
      const height = Math.min(containerWidth / aspectRatio, window.innerHeight * 0.6);
      const width = height * aspectRatio;

      containerEl.style.width = `${width}px`;
      containerEl.style.height = `${height}px`;
    }
  }
}