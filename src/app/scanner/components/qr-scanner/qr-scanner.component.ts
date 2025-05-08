// src/app/components/qr-scanner/qr-scanner.component.ts
import { Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';

import { LastResultComponent } from '../last-result/last-result.component';
import { HistoryComponent } from '../history/history.component';
import { ThemeService } from '../../../services/theme.service';
import { Registro } from '../../../models/registro.model';
import { ScannerComponent } from '../scanner/scanner.component';
import { DetailsModalComponent } from '../details-modal/details-modal.component';
import { HttpClientModule } from '@angular/common/http';
import { SystemStatusComponent } from '../system-status/system-status.component';
import { QuickGuideComponent } from '../quick-guide/quick-guide.component';
import { DailyStatsComponent } from '../daily-stats/daily-stats.component';
import { HelpChatComponent } from '../help-chat/help-chat.component';
import { ScannerService } from '../../../services/scanner.service';


@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    HeaderComponent,
    ScannerComponent,
    LastResultComponent,
    HistoryComponent,
    DetailsModalComponent,
    SystemStatusComponent,
    QuickGuideComponent,
    DailyStatsComponent,
    HelpChatComponent,
    
  ],
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss'],
 
})
export class QrScannerComponent implements OnInit {
  private themeService = inject(ThemeService);
  private scannerService = inject(ScannerService);
  
  selectedRegistro = signal<Registro | null>(null);
  showDetailsModal = signal<boolean>(false);
  
  // Para acceso en el template
  get darkMode() { return this.themeService.darkMode; }
  
  ngOnInit(): void {
    // Inicializar el servicio de escáner
    this.scannerService.initialize();
  }
  
  openDetailsModal(registro: Registro): void {
    this.selectedRegistro.set(registro);
    this.showDetailsModal.set(true);
  }
  
  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
  }
  
  // Método para destruir recursos al desmontar el componente
  ngOnDestroy(): void {
    // Liberar recursos
    this.scannerService.destroy();
  }
}