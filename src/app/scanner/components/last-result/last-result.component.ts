// src/app/components/last-result/last-result.component.ts
import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScannerService } from '../../../services/scanner.service';
import { Registro } from '../../../models/registro.model';
import { Formatters } from '../../../shared/utils/formatter';


@Component({
    selector: 'app-last-result',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './last-result.component.html',

  })
  export class LastResultComponent {
    @Output() showDetailsEvent = new EventEmitter<Registro>();
    
    private scannerService = inject(ScannerService);
    
    // Añadir Formatters como propiedad para usarlo en el template
    formatters = Formatters;
    
    get lastScanResult() { return this.scannerService.lastScanResult; }
    
    getEstadoClass(estado: string): string {
      return this.scannerService.getEstadoClass(estado || '');
    }
    
    showDetails(registro: Registro): void {
      this.showDetailsEvent.emit(registro);
    }
    
    // Métodos actualizados para manejar valores undefined
    formatEstado(estado?: string): string {
      return Formatters.formatEstado(estado || '');
    }
    
    formatGradoNivel(nivel?: string, grado?: number, seccion?: string): string {
      return Formatters.formatGradoNivel(nivel, grado, seccion);
    }
    
    formatStudentName(nombre?: string, apellido?: string): string {
      return Formatters.formatStudentName(nombre || '', apellido || '');
    }
  }