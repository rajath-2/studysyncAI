import { fetchAPI } from '@/lib/api';
import { User } from './auth';

export interface PreferencesUpdate {
  subjects: {
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    is_custom?: boolean;
  }[];
  availability: {
    preset: string[];
    custom?: {
      days: string[];
      time_start: string;
      time_end: string;
    }[];
  };
  learning_style?: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
}

export const usersService = {
  async getUser(userId: string, token: string): Promise<User> {
    return fetchAPI<User>(`/users/${userId}`, {
      method: 'GET',
      token,
    });
  },

  async updateUser(userId: string, data: Partial<User>, token: string): Promise<User> {
    return fetchAPI<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  },

  async getPreferences(userId: string, token: string): Promise<any> {
    return fetchAPI<any>(`/users/${userId}/preferences`, {
      method: 'GET',
      token,
    });
  },

  async updatePreferences(userId: string, preferences: PreferencesUpdate, token: string): Promise<any> {
    return fetchAPI<any>(`/users/${userId}/preferences`, {
      method: 'PATCH',
      body: JSON.stringify(preferences),
      token,
    });
  },
};
