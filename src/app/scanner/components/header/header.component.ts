import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../services/theme.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private themeService = inject(ThemeService);
  
  get darkMode() {
    return this.themeService.darkMode;
  }
  
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}