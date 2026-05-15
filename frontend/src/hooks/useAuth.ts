'use client';

import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const {
    user,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated,
  } = useAuthStore();

  return {
    user,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated,
  };
}