/**
 * API Client
 * Centralized API communication layer
 */

// Vite environment variables
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

/**
 * Generic fetch wrapper with error handling
 */
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
}
