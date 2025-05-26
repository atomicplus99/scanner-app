// src/app/components/help-chat/help-chat.component.ts

import { Component, signal, computed, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../services/theme.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReplacePipe } from './help-chat.pipe';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  options?: ChatOption[];
}

interface ChatOption {
  text: string;
  value: string;
}

@Component({
  selector: 'app-help-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ReplacePipe],
  templateUrl: './help-chat.component.html',
  styleUrls: ['./help-chat.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(10px)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class HelpChatComponent implements OnInit {
  private themeService = inject(ThemeService);
  
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  
  // Estado reactivo con señales
  isChatOpen = signal<boolean>(false);
  chatMessages = signal<ChatMessage[]>([]);
  userInputText = signal<string>('');
  unreadMessages = signal<number>(0);
  isTyping = signal<boolean>(false);
  
  // Estado computado
  darkMode = computed(() => this.themeService.darkMode());
  
  // Categorías principales de opciones
  mainOptions: ChatOption[] = [
    { text: 'Cómo usar el escáner', value: 'scanner-help' },
    { text: 'Problemas con el escaneo', value: 'scanner-issues' },
    { text: 'Significado de los estados', value: 'status-info' },
    { text: 'Información de horarios', value: 'schedule-info' },
    { text: 'Otras consultas', value: 'other' }
  ];
  
  // Respuestas predefinidas para cada categoría
  private responseTree: { [key: string]: { text: string, options?: ChatOption[] } } = {
    'welcome': {
      text: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
      options: this.mainOptions
    },
    
    // Categoría: Cómo usar el escáner
    'scanner-help': {
      text: 'El escáner QR permite registrar entradas y salidas de estudiantes. ¿Qué te gustaría saber?',
      options: [
        { text: 'Pasos para escanear', value: 'scan-steps' },
        { text: 'Posición correcta del QR', value: 'qr-position' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'scan-steps': {
      text: 'Para escanear un código QR correctamente:\n\n1. Asegúrate de que la cámara esté habilitada\n2. Coloca el código QR frente a la cámara\n3. Mantén el código estable hasta que el sistema lo reconozca\n4. Verifica el resultado en el panel "Último registro"',
      options: [
        { text: 'Posición correcta del QR', value: 'qr-position' },
        { text: 'Tengo problemas al escanear', value: 'scanner-issues' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'qr-position': {
      text: 'Para una lectura óptima del código QR:\n\n1. Coloca el código QR a unos 15-20 cm de la cámara\n2. Asegúrate de que el código esté completamente visible en el marco\n3. Evita reflejos o sombras sobre el código\n4. Mantén estable el código durante el escaneo',
      options: [
        { text: 'Tengo problemas al escanear', value: 'scanner-issues' },
        { text: 'Volver al menú de ayuda del escáner', value: 'scanner-help' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    
    // Categoría: Problemas con el escaneo
    'scanner-issues': {
      text: '¿Qué problema estás experimentando con el escáner?',
      options: [
        { text: 'La cámara no funciona', value: 'camera-issue' },
        { text: 'El código no se reconoce', value: 'qr-not-recognized' },
        { text: 'Error de conexión', value: 'connection-error' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'camera-issue': {
      text: 'Si la cámara no funciona:\n\n1. Verifica los permisos del navegador (clic en el icono de candado en la URL)\n2. Asegúrate de que ninguna otra aplicación esté usando la cámara\n3. Actualiza la página\n4. Prueba con otro navegador si el problema persiste',
      options: [
        { text: 'El problema persiste', value: 'contact-support' },
        { text: 'Otros problemas', value: 'scanner-issues' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'qr-not-recognized': {
      text: 'Si el código QR no es reconocido:\n\n1. Asegúrate de que el código no esté dañado o borroso\n2. Mejora la iluminación para aumentar el contraste\n3. Limpia la cámara si está sucia\n4. Verifica que estés usando el código QR correcto para el sistema',
      options: [
        { text: 'El problema persiste', value: 'contact-support' },
        { text: 'Otros problemas', value: 'scanner-issues' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'connection-error': {
      text: 'Si estás experimentando errores de conexión:\n\n1. Verifica tu conexión a internet\n2. Comprueba que el servidor esté en funcionamiento\n3. Intenta actualizar la página\n4. Si el problema persiste, puede ser un problema del servidor',
      options: [
        { text: 'Verificar estado del sistema', value: 'system-status' },
        { text: 'Contactar soporte', value: 'contact-support' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    
    // Categoría: Significado de los estados
    'status-info': {
      text: '¿Sobre qué estado necesitas información?',
      options: [
        { text: 'Estado "Puntual"', value: 'punctual-status' },
        { text: 'Estado "Tardanza"', value: 'late-status' },
        { text: 'Estado "Falta"', value: 'absent-status' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'punctual-status': {
      text: 'Estado "Puntual" significa que el estudiante llegó dentro del horario establecido. Esto generalmente es antes de los primeros 5-10 minutos del inicio de clases, dependiendo de la configuración del centro educativo.',
      options: [
        { text: 'Información de otros estados', value: 'status-info' },
        { text: 'Información de horarios', value: 'schedule-info' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'late-status': {
      text: 'Estado "Tardanza" significa que el estudiante llegó después del horario puntual pero antes del límite de tardanza. Esto suele ser entre 5-10 minutos y 30 minutos después del inicio, dependiendo de la configuración del centro.',
      options: [
        { text: 'Información de otros estados', value: 'status-info' },
        { text: 'Información de horarios', value: 'schedule-info' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'absent-status': {
      text: 'Estado "Falta" significa que el estudiante llegó después del límite de tardanza o no se registró en absoluto. Generalmente, esto ocurre después de los 30 minutos del inicio de clases, aunque puede variar según la configuración.',
      options: [
        { text: 'Información de otros estados', value: 'status-info' },
        { text: 'Información de horarios', value: 'schedule-info' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    
    // Categoría: Información de horarios
    'schedule-info': {
      text: '¿Qué información de horarios necesitas?',
      options: [
        { text: 'Horarios por turno', value: 'shift-schedule' },
        { text: 'Registros de salida', value: 'exit-records' },
        { text: 'Límites de tolerancia', value: 'tolerance-limits' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'shift-schedule': {
      text: 'Los horarios están configurados según el turno:\n\n• Turno mañana: 7:30 a 13:00\n• Turno tarde: 13:05 a 18:15\n\nEstos horarios pueden variar según la configuración específica de tu institución.',
      options: [
        { text: 'Límites de tolerancia', value: 'tolerance-limits' },
        { text: 'Registros de salida', value: 'exit-records' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'exit-records': {
      text: 'Sobre los registros de salida:\n\n• Solo pueden registrarse después de la hora oficial de fin del turno\n• Salidas anticipadas deben ser autorizadas por administración\n• Si un estudiante no registra salida, el sistema marca salida automática al final del día',
      options: [
        { text: 'Horarios por turno', value: 'shift-schedule' },
        { text: 'Otros temas de horarios', value: 'schedule-info' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'tolerance-limits': {
      text: 'Límites de tolerancia estándar:\n\n• Puntual: Dentro de los primeros 5 minutos del inicio\n• Tardanza: Entre 5 y 30 minutos después del inicio\n• Falta: Más de 30 minutos después del inicio\n\nEstos límites pueden ajustarse en la configuración del sistema.',
      options: [
        { text: 'Información de estados', value: 'status-info' },
        { text: 'Otros temas de horarios', value: 'schedule-info' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    
    // Otras opciones
    'system-status': {
      text: 'El estado del sistema se muestra en el panel superior de la aplicación. Allí puedes ver información sobre la conexión al servidor, estado de la cámara y cualquier problema actual del sistema.',
      options: [
        { text: 'Problemas con el escáner', value: 'scanner-issues' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'contact-support': {
      text: 'Para contactar con soporte técnico:\n\n• Email: soporte@sistemaasistencia.com\n• Teléfono: 123-456-789\n• Horario de atención: Lunes a Viernes, 8:00 a 18:00\n\nPor favor, menciona el código de error si lo has recibido.',
      options: [
        { text: 'Verificar estado del sistema', value: 'system-status' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'other': {
      text: 'Puedo ayudarte con diversas consultas. Por favor, selecciona una de las siguientes opciones:',
      options: [
        { text: 'Exportar registros', value: 'export-records' },
        { text: 'Configuración del sistema', value: 'system-config' },
        { text: 'Reportes y estadísticas', value: 'reports' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'export-records': {
      text: 'Para exportar registros:\n\n1. Ve a la sección "Historial de registros"\n2. Utiliza los filtros para seleccionar el período deseado\n3. Haz clic en el botón "Exportar" en la esquina superior derecha\n4. Selecciona el formato deseado (CSV, Excel, PDF)\n5. Confirma la exportación',
      options: [
        { text: 'Reportes y estadísticas', value: 'reports' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'system-config': {
      text: 'La configuración del sistema está disponible solo para administradores. Si necesitas realizar cambios en la configuración, contacta al administrador del sistema.',
      options: [
        { text: 'Contactar soporte', value: 'contact-support' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    },
    'reports': {
      text: 'El sistema ofrece diversos reportes estadísticos:\n\n• Resumen diario de asistencia\n• Reporte mensual por estudiante\n• Estadísticas de puntualidad\n• Tendencias de asistencia\n\nPuedes acceder a ellos desde el panel de estadísticas o el menú de reportes.',
      options: [
        { text: 'Exportar registros', value: 'export-records' },
        { text: 'Volver al menú principal', value: 'welcome' }
      ]
    }
  };

  ngOnInit(): void {
    // Iniciar con mensaje de bienvenida
    this.sendBotMessage('welcome');
  }

  toggleChat(): void {
    const newState = !this.isChatOpen();
    this.isChatOpen.set(newState);
    
    if (newState) {
      // Si se abre el chat, resetear contador de no leídos
      this.unreadMessages.set(0);
      
      // Focus en el input cuando se abre
      setTimeout(() => {
        const inputElement = document.querySelector('.chat-input input') as HTMLInputElement;
        if (inputElement) inputElement.focus();
      }, 200);
    }
  }

  sendMessage(): void {
    const text = this.userInputText().trim();
    if (!text) return;
    
    // Agregar mensaje del usuario
    this.addUserMessage(text);
    
    // Limpiar input
    this.userInputText.set('');
    
    // Simular respuesta del bot
    this.isTyping.set(true);
    setTimeout(() => {
      // Procesamiento simple basado en palabras clave
      this.processUserInput(text);
      this.isTyping.set(false);
      this.scrollToBottom();
    }, 700);
  }

  selectOption(value: string): void {
    // Buscar la opción completa para mostrar su texto
    let selectedText = '';
    
    // Buscar en todas las opciones disponibles
    Object.values(this.responseTree).forEach(response => {
      if (response.options) {
        const foundOption = response.options.find(option => option.value === value);
        if (foundOption) {
          selectedText = foundOption.text;
        }
      }
    });
    
    if (!selectedText) {
      selectedText = value; // Fallback si no encontramos el texto
    }
    
    // Agregar la selección como mensaje del usuario
    this.addUserMessage(selectedText);
    
    // Simular respuesta del bot
    this.isTyping.set(true);
    setTimeout(() => {
      this.sendBotMessage(value);
      this.isTyping.set(false);
      this.scrollToBottom();
    }, 700);
  }

  private addUserMessage(text: string): void {
    this.chatMessages.update(messages => [
      ...messages,
      {
        sender: 'user',
        text: text,
        timestamp: new Date()
      }
    ]);
    
    this.scrollToBottom();
  }

  private sendBotMessage(responseKey: string): void {
    const response = this.responseTree[responseKey] || this.responseTree['welcome'];
    
    // Si el chat está cerrado, incrementar contador de no leídos
    if (!this.isChatOpen()) {
      this.unreadMessages.update(count => count + 1);
    }
    
    this.chatMessages.update(messages => [
      ...messages,
      {
        sender: 'bot',
        text: response.text,
        timestamp: new Date(),
        options: response.options
      }
    ]);
    
    this.scrollToBottom();
  }

  private processUserInput(text: string): void {
    const input = text.toLowerCase();
    
    // Procesamiento simple basado en palabras clave
    if (input.includes('escáner') || input.includes('scanner') || input.includes('escanear')) {
      if (input.includes('problema') || input.includes('error') || input.includes('no funciona')) {
        this.sendBotMessage('scanner-issues');
      } else {
        this.sendBotMessage('scanner-help');
      }
    } else if (input.includes('puntual') || input.includes('tardanza') || input.includes('falta') || input.includes('estado')) {
      this.sendBotMessage('status-info');
    } else if (input.includes('horario') || input.includes('turno') || input.includes('hora')) {
      this.sendBotMessage('schedule-info');
    } else if (input.includes('gracias') || input.includes('thanks')) {
      this.sendBotMessage('welcome');
    } else if (input.includes('contactar') || input.includes('soporte') || input.includes('ayuda')) {
      this.sendBotMessage('contact-support');
    } else if (input.includes('exportar') || input.includes('descargar') || input.includes('reporte')) {
      this.sendBotMessage('export-records');
    } else {
      // Respuesta por defecto para entradas no reconocidas
      this.sendBotMessage('other');
    }
  }

  getChatClass(): string {
    return this.isChatOpen() ? 'open' : 'closed';
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer) {
        const element = this.chatContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }
}