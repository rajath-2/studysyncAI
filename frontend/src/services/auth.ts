import { fetchAPI } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  university?: string;
  preferences: {
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
  };
  is_onboarding_complete: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  async login(data: LoginRequest, token?: string): Promise<AuthResponse> {
    return fetchAPI<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  async register(data: RegisterRequest, token?: string): Promise<AuthResponse> {
    return fetchAPI<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  async getMe(token: string): Promise<User> {
    return fetchAPI<User>('/auth/me', {
      method: 'GET',
      token,
    });
  },

  async logout(token: string): Promise<void> {
    return fetchAPI<void>('/auth/logout', {
      method: 'POST',
      token,
    });
  },
};
