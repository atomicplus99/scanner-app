// src/app/components/help-chat/help-chat.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../services/theme.service';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-help-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './help-chat.component.html',
  styleUrls: ['./help-chat.component.scss']
})
export class HelpChatComponent {
  private themeService = inject(ThemeService);
  
  // Estado del chat
  isChatOpen = signal<boolean>(false);
  userInputText = ''; // Variable normal para la entrada de texto
  chatMessages = signal<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Hola, soy el asistente virtual del sistema de asistencia. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ]);
  
  // Para acceso en el template
  get darkMode() { return this.themeService.darkMode; }
  
  // Preguntas frecuentes con sus respuestas
  private faqs: { [key: string]: string } = {
    'qué es esto': 'Este es un sistema de control de asistencia que registra entradas y salidas de estudiantes mediante códigos QR.',
    'cómo funciona': 'Debes escanear el código QR del estudiante. El sistema registrará la entrada o salida y mostrará la información del estudiante.',
    'qué significa puntual': 'Estado "Puntual" significa que el estudiante llegó dentro del horario establecido.',
    'qué significa tardanza': 'Estado "Tardanza" significa que el estudiante llegó después del horario establecido pero antes del límite de tardanza.',
    'qué significa falta': 'Estado "Falta" significa que el estudiante llegó después del límite de tardanza o no se registró.',
    'no puedo escanear': 'Asegúrate de que la cámara esté funcionando y que el código QR sea visible y no esté dañado.',
    'error de conexión': 'Verifica tu conexión a internet y que el servidor esté en funcionamiento.',
    'horarios': 'Los horarios están configurados en el sistema según el turno del estudiante. Generalmente, el turno de mañana es de 7:30 a 13:00 y el turno de tarde de 13:05 a 18:19.',
    'registro de salida': 'Las salidas solo pueden registrarse después de la hora de fin del turno del estudiante.'
  };
  
  toggleChat(): void {
    this.isChatOpen.update(value => !value);
  }
  
  sendMessage(): void {
    if (!this.userInputText.trim()) return;
    
    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      sender: 'user',
      text: this.userInputText,
      timestamp: new Date()
    };
    
    this.chatMessages.update(messages => [...messages, userMessage]);
    
    // Guardar el texto para procesarlo antes de limpiar el input
    const userInput = this.userInputText;
    
    // Limpiar input
    this.userInputText = '';
    
    // Procesar mensaje y generar respuesta
    setTimeout(() => {
      const botResponse = this.generateResponse(userInput);
      
      const botMessage: ChatMessage = {
        sender: 'bot',
        text: botResponse,
        timestamp: new Date()
      };
      
      this.chatMessages.update(messages => [...messages, botMessage]);
      
      // Hacer scroll al último mensaje
      this.scrollToBottom();
    }, 500);
  }
  
  private generateResponse(userInput: string): string {
    const input = userInput.toLowerCase().trim();
    
    // Buscar coincidencias en las FAQs
    for (const [keyword, response] of Object.entries(this.faqs)) {
      if (input.includes(keyword) || input.includes(keyword.replace(' ', ''))) {
        return response;
      }
    }
    
    // Respuestas para saludos
    if (input.match(/^(hola|buenos dias|buenas tardes|buenas noches|hey|hi)/)) {
      return '¡Hola! ¿En qué puedo ayudarte?';
    }
    
    // Respuestas para agradecimientos
    if (input.match(/(gracias|thanks|ty|thx)/)) {
      return '¡De nada! ¿Hay algo más en lo que pueda ayudarte?';
    }
    
    // Respuesta por defecto
    return 'Lo siento, no entiendo tu consulta. Puedes preguntar sobre cómo funciona el sistema, qué significan los estados, horarios o problemas comunes.';
  }
  
  getChatClass(): string {
    return this.isChatOpen() ? 'open' : 'closed';
  }
  
  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }
}