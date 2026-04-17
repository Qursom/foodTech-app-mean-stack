import { Component, OnInit } from '@angular/core';
import { ChatService } from '../../../services/chat.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit {

  isOpen$: Observable<boolean>;
  messages$: Observable<any[]>;
  newMessage: string = '';

  constructor(private chatService: ChatService) {
    this.isOpen$ = this.chatService.isOpen;
    this.messages$ = this.chatService.messages;
  }

  ngOnInit(): void {
  }

  toggleChat() {
    this.chatService.openChat();
  }

  closeChat() {
    this.chatService.closeChat();
  }

  async sendMessage() {
    if (this.newMessage.trim()) {
      await this.chatService.sendMessage(this.newMessage.trim());
      this.newMessage = '';
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }
}