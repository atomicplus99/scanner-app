// src/app/components/quick-guide/quick-guide.component.ts
import { Component, signal, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class QuickGuideComponent implements OnInit {
  isExpanded = signal<boolean>(false);
  selectedTab = signal<string>('scanner');
  
  // Evitar que los clics en el contenedor se propaguen al documento
  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.stopPropagation();
  }
  
  // Cerrar la guía al presionar Escape
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isExpanded()) {
      this.toggleGuide();
    }
  }
  
  // Cerrar la guía si se hace clic fuera de ella
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Si la guía está abierta y el clic no fue en el botón flotante o en la guía
    if (this.isExpanded() && !(event.target as HTMLElement).closest('.guide-container, .guide-floating-button')) {
      this.toggleGuide();
    }
  }
  
  ngOnInit(): void {
    // Asegurarse de que la guía esté cerrada al inicio
    this.isExpanded.set(false);
  }
  
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