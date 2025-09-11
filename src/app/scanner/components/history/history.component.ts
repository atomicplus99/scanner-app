// src/app/components/history/history.component.ts
import { Component, EventEmitter, inject, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScannerService } from '../../../services/scanner.service';
import { Registro } from '../../../models/registro.model';
import { Formatters } from '../../../shared/utils/formatter';

@Component({
    selector: 'app-history',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './history.component.html',
  })
  export class HistoryComponent {
    @Output() showDetailsEvent = new EventEmitter<Registro>();
    
    private scannerService = inject(ScannerService);
    
    // Paginación
    currentPage = signal(1);
    itemsPerPage = signal(5);
    
    // Añadir Formatters como propiedad para usarlo en el template
    formatters = Formatters;
    
    get registrosRecientes() { return this.scannerService.registrosRecientes; }
    
    // Computed para registros paginados
    paginatedRegistros = computed(() => {
      const allRegistros = this.registrosRecientes();
      const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
      const endIndex = startIndex + this.itemsPerPage();
      return allRegistros.slice(startIndex, endIndex);
    });
    
    // Computed para información de paginación
    paginationInfo = computed(() => {
      const totalItems = this.registrosRecientes().length;
      const totalPages = Math.ceil(totalItems / this.itemsPerPage());
      const currentPage = this.currentPage();
      
      return {
        totalItems,
        totalPages,
        currentPage,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        startItem: (currentPage - 1) * this.itemsPerPage() + 1,
        endItem: Math.min(currentPage * this.itemsPerPage(), totalItems)
      };
    });
    
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
    
    onImageError(event: any): void {
      // Si la imagen falla al cargar, usar la imagen por defecto
      event.target.src = 'assets/images/user-default.svg';
    }
    
    // Métodos de paginación
    goToPage(page: number): void {
      const info = this.paginationInfo();
      if (page >= 1 && page <= info.totalPages) {
        this.currentPage.set(page);
      }
    }
    
    nextPage(): void {
      const info = this.paginationInfo();
      if (info.hasNext) {
        this.currentPage.set(info.currentPage + 1);
      }
    }
    
    prevPage(): void {
      const info = this.paginationInfo();
      if (info.hasPrev) {
        this.currentPage.set(info.currentPage - 1);
      }
    }
    
    changeItemsPerPage(newSize: number): void {
      this.itemsPerPage.set(newSize);
      this.currentPage.set(1); // Reset to first page
    }
    
    onItemsPerPageChange(event: Event): void {
      const target = event.target as HTMLSelectElement;
      const newSize = parseInt(target.value, 10);
      this.changeItemsPerPage(newSize);
    }
    
    // Generar array de páginas para mostrar
    getPageNumbers(): number[] {
      const info = this.paginationInfo();
      const pages: number[] = [];
      const maxVisiblePages = 5;
      
      let startPage = Math.max(1, info.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(info.totalPages, startPage + maxVisiblePages - 1);
      
      // Ajustar si estamos cerca del final
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      return pages;
    }
  }