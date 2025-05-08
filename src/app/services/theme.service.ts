// src/app/services/theme.service.ts

import { Injectable, signal, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  darkMode = signal<boolean>(false);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      // Detectar preferencia de tema del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
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
      if (isDark) {
        document.body.classList.add('dark-theme-body');
      } else {
        document.body.classList.remove('dark-theme-body');
      }
    }
  }
}