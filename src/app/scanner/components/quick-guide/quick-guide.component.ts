// src/app/components/quick-guide/quick-guide.component.ts
import { Component, signal, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../services/theme.service';


interface GuideItem {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-quick-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quick-guide.component.html',
  styleUrls: ['./quick-guide.component.scss'],
 
})
export class QuickGuideComponent {
  private themeService = inject(ThemeService);
  
  // Para acceso en el template
  get darkMode() { return this.themeService.darkMode; }
  
  isExpanded = signal<boolean>(false);
  selectedTab = signal<string>('scanner');
  
  scannerGuide: GuideItem[] = [
    {
      icon: 'qr_code_scanner',
      title: 'Escaneo del código QR',
      description: 'Apunta la cámara al código QR del estudiante. Mantén el código dentro del recuadro hasta que sea detectado.'
    },
    {
      icon: 'light_mode',
      title: 'Uso de la linterna',
      description: 'En condiciones de poca luz, activa la linterna usando el botón correspondiente.'
    },
    {
      icon: 'camera_alt',
      title: 'Cambio de cámara',
      description: 'Si tu dispositivo tiene múltiples cámaras, puedes cambiar entre ellas desde el menú de configuración.'
    },
    {
      icon: 'error',
      title: 'Solución de problemas',
      description: 'Si el código no se escanea, verifica la calidad y visibilidad del código QR, la iluminación y la conexión a internet.'
    }
  ];
  
  statusGuide: GuideItem[] = [
    {
      icon: 'check_circle',
      title: 'Puntual',
      description: 'El estudiante ha llegado dentro del horario establecido. Se registra como asistencia normal.'
    },
    {
      icon: 'watch_later',
      title: 'Tardanza',
      description: 'El estudiante ha llegado después del horario establecido pero antes del límite de tardanza.'
    },
    {
      icon: 'cancel',
      title: 'Falta',
      description: 'El estudiante ha llegado después del límite de tardanza o no se ha registrado en el día.'
    },
    {
      icon: 'warning',
      title: 'Error',
      description: 'Ha ocurrido un error al procesar el código QR. Puede deberse a un código inválido o a un problema de conexión.'
    }
  ];
  
  toggleGuide(): void {
    this.isExpanded.update(value => !value);
  }
  
  setTab(tab: string): void {
    this.selectedTab.set(tab);
  }
  
  getGuideClasses(): { [key: string]: boolean } {
    return {
      'expanded': this.isExpanded(),
      'collapsed': !this.isExpanded()
    };
  }
  
  isTabActive(tab: string): boolean {
    return this.selectedTab() === tab;
  }
}