// src/app/components/details-modal/details-modal.component.ts
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScannerService } from '../../../services/scanner.service';
import { Registro } from '../../../models/registro.model';
import { Formatters } from '../../../shared/utils/formatter';


@Component({
    selector: 'app-details-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './details-modal.component.html',
  })
  export class DetailsModalComponent {
    @Input() registro: Registro | null = null;
    @Input() isVisible: boolean = false;
    @Output() closeModal = new EventEmitter<void>();
    
    private scannerService = inject(ScannerService);
    
    // Añadir Formatters como propiedad para usarlo en el template
    formatters = Formatters;
    
    getEstadoClass(estado: string): string {
      return this.scannerService.getEstadoClass(estado);
    }
    
    close(): void {
      this.closeModal.emit();
    }
    
    printDetails(): void {
      window.print();
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
    
    formatId(id: string): string {
      return Formatters.shortId(id, 10);
    }
  }