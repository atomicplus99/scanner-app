import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { QrScannerComponent } from "./scanner/components/qr-scanner/qr-scanner.component";


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, QrScannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'qr-lector-app-andres-huaral';
}
