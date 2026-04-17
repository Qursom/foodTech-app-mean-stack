import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CHATBOT_SEND_MESSAGE_URL } from '../shared/constants/urls';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private isChatOpenSubject = new BehaviorSubject<boolean>(false);
  private messagesSubject = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient) { }

  openChat() {
    this.isChatOpenSubject.next(true);
  }

  closeChat() {
    this.isChatOpenSubject.next(false);
  }

  get isOpen() {
    return this.isChatOpenSubject.asObservable();
  }

  get messages() {
    return this.messagesSubject.asObservable();
  }

  async sendMessage(message: string) {
    const currentMessages = this.messagesSubject.value;
    const history = currentMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));

    const newMessages = [...currentMessages, { role: 'user', text: message }];
    this.messagesSubject.next(newMessages);

    try {
      const response: any = await this.http
        .post(CHATBOT_SEND_MESSAGE_URL, { message, history })
        .toPromise();
      const botMessage = { role: 'assistant', text: response.response };
      this.messagesSubject.next([...newMessages, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { role: 'assistant', text: 'Sorry, I am unable to respond right now.' };
      this.messagesSubject.next([...newMessages, errorMessage]);
    }
  }
}
