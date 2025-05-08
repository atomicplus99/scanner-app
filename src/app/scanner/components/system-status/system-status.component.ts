// src/app/components/system-status/system-status.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { ThemeService } from '../../../services/theme.service';


@Component({
  selector: 'app-system-status',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './system-status.component.html',
  styleUrls: ['./system-status.component.scss']
})
export class SystemStatusComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private themeService = inject(ThemeService);
  
  currentTime = new Date();
  isServerConnected = false;
  checkingConnection = false;
  lastConnectionCheck: Date | null = null;
  
  private timeSubscription: Subscription | null = null;
  private connectionSubscription: Subscription | null = null;
  
  // Para acceso en el template
  get darkMode() { return this.themeService.darkMode; }
  
  ngOnInit(): void {
    // Actualizar la hora cada segundo
    this.timeSubscription = interval(1000).subscribe(() => {
      this.currentTime = new Date();
    });
    
    // Verificar la conexión al iniciar
    this.checkServerConnection();
    
    // Verificar la conexión cada 30 segundos
    this.connectionSubscription = interval(30000).subscribe(() => {
      this.checkServerConnection();
    });
  }
  
  ngOnDestroy(): void {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
    
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
  }
  
  checkServerConnection(): void {
    if (this.checkingConnection) return;
    
    this.checkingConnection = true;
    
    this.apiService.checkServerStatus().subscribe({
      next: () => {
        this.isServerConnected = true;
        this.lastConnectionCheck = new Date();
        this.checkingConnection = false;
      },
      error: () => {
        this.isServerConnected = false;
        this.lastConnectionCheck = new Date();
        this.checkingConnection = false;
      }
    });
  }
  
  getConnectionClass(): string {
    return this.isServerConnected ? 'connected' : 'disconnected';
  }
  
  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}