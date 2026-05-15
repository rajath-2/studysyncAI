import { fetchAPI } from '@/lib/api';

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface SendMessageRequest {
  content: string;
}

export const messagesService = {
  async getMessages(groupId: string, token: string, limit: number = 50): Promise<{ messages: Message[] }> {
    return fetchAPI<{ messages: Message[] }>(`/messages/${groupId}?limit=${limit}`, { method: 'GET', token });
  },

  async sendMessage(groupId: string, data: SendMessageRequest, token: string): Promise<Message> {
    return fetchAPI<Message>(`/messages/${groupId}`, { method: 'POST', body: JSON.stringify(data), token });
  },
};