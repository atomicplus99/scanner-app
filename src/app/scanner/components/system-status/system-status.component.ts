import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-system-status',
  templateUrl: './system-status.component.html',
  styleUrls: ['./system-status.component.scss']
})
export class SystemStatusComponent implements OnInit, OnDestroy {
  currentTime = new Date();
  isServerConnected = true; // Siempre mostramos el servidor como conectado
  checkingConnection = false;
  
  private timeSubscription: Subscription | null = null;

  ngOnInit(): void {
    // Actualizar el tiempo cada segundo
    this.timeSubscription = interval(1000).subscribe(() => {
      this.currentTime = new Date();
    });
  }

  ngOnDestroy(): void {
    // Limpiar la suscripción al destruir el componente
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  getConnectionClass(): string {
    return this.isServerConnected ? 'connected' : 'disconnected';
  }

  checkServerConnection(): void {
    this.checkingConnection = true;
    
    // Simular una comprobación de conexión
    setTimeout(() => {
      // Siempre establecemos el servidor como conectado
      this.isServerConnected = true;
      this.checkingConnection = false;
    }, 800);
  }
}