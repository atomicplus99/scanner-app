import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../services/theme.service';
import { ApiService } from '../../../services/api.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {
  private themeService = inject(ThemeService);
  private apiService = inject(ApiService);
  
  serverStatus: 'online' | 'offline' = 'offline';
  
  ngOnInit() {
    this.checkServerStatus();
    // Verificar cada 30 segundos
    setInterval(() => {
      console.log('⏰ Verificación automática del servidor (cada 30s)...');
      this.checkServerStatus();
    }, 30000);
  }
  
  private checkServerStatus() {
    
    this.apiService.checkServerStatus().subscribe({
      next: (response) => {
        this.serverStatus = 'online';
      },
      error: (error) => {
        this.serverStatus = 'offline';
      }
    });
  }
  
  get darkMode() {
    return this.themeService.darkMode;
  }
  
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}