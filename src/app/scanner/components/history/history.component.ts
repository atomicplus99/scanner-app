// src/app/components/history/history.component.ts
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScannerService } from '../../../services/scanner.service';
import { Registro } from '../../../models/registro.model';
import { Formatters } from '../../../shared/utils/formatter';

@Component({
    selector: 'app-history',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './history.component.html',
    styleUrls: ['./history.component.scss']
  })
  export class HistoryComponent {
    @Output() showDetailsEvent = new EventEmitter<Registro>();
    
    private scannerService = inject(ScannerService);
    
    // Añadir Formatters como propiedad para usarlo en el template
    formatters = Formatters;
    
    get registrosRecientes() { return this.scannerService.registrosRecientes; }
    
    getEstadoClass(estado: string): string {
      return this.scannerService.getEstadoClass(estado);
    }
    
    showDetails(registro: Registro): void {
      this.showDetailsEvent.emit(registro);
    }
    
    // Métodos que utilizan Formatters
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