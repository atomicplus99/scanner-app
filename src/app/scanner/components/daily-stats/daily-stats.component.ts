// src/app/components/daily-stats/daily-stats.component.ts
import { Component, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScannerService } from '../../../services/scanner.service';
import { ThemeService } from '../../../services/theme.service';
import { Statistic } from '../../../models/registro.model';

@Component({
  selector: 'app-daily-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-stats.component.html',
  styleUrls: ['./daily-stats.component.scss']
})
export class DailyStatsComponent implements OnInit {
  private scannerService = inject(ScannerService);
  private themeService = inject(ThemeService);
  
  // Para acceso en el template
  get darkMode() { return this.themeService.darkMode; }
  
  stats = signal<Statistic[]>([
    { icon: 'how_to_reg', title: 'Asistencias', value: 0, color: 'success' },
    { icon: 'watch_later', title: 'Tardanzas', value: 0, color: 'warning' },
    { icon: 'cancel', title: 'Faltas', value: 0, color: 'error' },
    { icon: 'info', title: 'Total', value: 0, color: 'info' }
  ]);
  
  // CORRECIÓN: Mover el effect fuera de ngOnInit como un inicializador de campo
  private statsEffect = effect(() => {
    // Obtener registros actuales
    const registros = this.scannerService.registrosRecientes();
    
    // Filtrar registros de hoy
    const today = new Date().toLocaleDateString();
    const todayRegistros = registros.filter(r => r.fecha === today);
    
    // Contar por estado
    const puntual = todayRegistros.filter(r => r.estado.toUpperCase() === 'PUNTUAL').length;
    const tardanza = todayRegistros.filter(r => r.estado.toUpperCase() === 'TARDANZA').length;
    const falta = todayRegistros.filter(r => r.estado.toUpperCase() === 'FALTA').length;
    const total = todayRegistros.length;
    
    // Actualizar estadísticas
    this.stats.update(currentStats => {
      return [
        { ...currentStats[0], value: puntual },
        { ...currentStats[1], value: tardanza },
        { ...currentStats[2], value: falta },
        { ...currentStats[3], value: total }
      ];
    });
  });
  
  ngOnInit(): void {
    // Si necesitas ejecutar código adicional en ngOnInit, puedes hacerlo aquí
  }
  
  getColorClass(color: string): string {
    return `color-${color}`;
  }
}