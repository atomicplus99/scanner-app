// src/app/services/theme.service.ts
import { Injectable, signal, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  darkMode = signal<boolean>(true); // CAMBIO: Iniciar en dark mode
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      // CAMBIO: Forzar dark mode siempre (o detectar preferencia)
      const prefersDark = true; // O: window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.darkMode.set(prefersDark);
      this.applyTheme(prefersDark);
    }
  }

  toggleTheme(): void {
    this.darkMode.update(value => {
      const newValue = !value;
      this.applyTheme(newValue);
      return newValue;
    });
  }

  private applyTheme(isDark: boolean): void {
    if (this.isBrowser) {
      const htmlElement = document.documentElement; // CAMBIO: Usar html en lugar de body
      
      if (isDark) {
        htmlElement.classList.add('dark'); // CAMBIO: Usar 'dark' en lugar de 'dark-theme-body'
        document.body.classList.add('dark-theme-body'); // Mantener si tienes CSS custom
      } else {
        htmlElement.classList.remove('dark');
        document.body.classList.remove('dark-theme-body');
      }
    }
  }
}