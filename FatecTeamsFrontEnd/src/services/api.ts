import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ApiResponse } from '../types';

// Configuração base da API
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' // URL de desenvolvimento
  : 'https://your-production-api.com/api'; // URL de produção

// Chaves para armazenamento
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

// Função auxiliar para armazenamento seguro multiplataforma
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }
};

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // ============================================
  // INTERCEPTORS SETUP
  // ============================================

  private setupInterceptors(): void {
    // Request interceptor - adicionar token de autenticação
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Erro ao obter token de acesso:', error);
        }
        
        // Log da requisição em desenvolvimento
        if (__DEV__) {
          console.log(`🔵 ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
          });
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - lidar com respostas e erros
    this.api.interceptors.response.use(
      (response) => {
        // Log da resposta em desenvolvimento
        if (__DEV__) {
          console.log(`🟢 ${response.status} ${response.config.url}`, response.data);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        
        // Log do erro em desenvolvimento
        if (__DEV__) {
          console.error(`🔴 ${error.response?.status} ${error.config?.url}`, {
            data: error.response?.data,
            message: error.message,
          });
        }

        // Se o erro é 401 (não autorizado) e não é uma tentativa de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Se já estiver fazendo refresh, aguardar
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.api(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              // Notificar todas as requisições aguardando
              this.refreshSubscribers.forEach((callback) => callback(newToken));
              this.refreshSubscribers = [];
              
              // Tentar novamente a requisição original
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Se o refresh falhar, fazer logout
            await this.clearAuthData();
            // Você pode emitir um evento aqui para notificar o app sobre logout
            console.error('Falha ao atualizar token, redirecionando para login');
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // AUTH TOKEN MANAGEMENT
  // ============================================

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data.dados;

      await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (newRefreshToken) {
        await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
      }

      return accessToken;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return null;
    }
  }

  public async saveAuthData(accessToken: string, refreshToken: string, userData: any): Promise<void> {
    try {
      await Promise.all([
        secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData)),
      ]);
    } catch (error) {
      console.error('Erro ao salvar dados de autenticação:', error);
      throw error;
    }
  }

  public async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        secureStorage.deleteItem(STORAGE_KEYS.ACCESS_TOKEN),
        secureStorage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);
    } catch (error) {
      console.error('Erro ao limpar dados de autenticação:', error);
    }
  }

  public async getStoredUserData(): Promise<any> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      return null;
    }
  }

  public async isAuthenticated(): Promise<boolean> {
    try {
      const token = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // HTTP METHODS
  // ============================================

  public async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, { params });
    return response.data;
  }

  public async post<T = any>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data);
    return response.data;
  }

  public async patch<T = any>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data);
    return response.data;
  }

  public async delete<T = any>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url);
    return response.data;
  }

  // ============================================
  // FILE UPLOAD
  // ============================================

  public async uploadFile<T = any>(
    url: string, 
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  }

  // ============================================
  // ERROR HANDLING
  // ============================================

  public handleError(error: any): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse>;
      
      if (axiosError.response?.data?.mensagem) {
        return axiosError.response.data.mensagem;
      }
      
      if (axiosError.response?.data?.erros?.length) {
        return axiosError.response.data.erros.join(', ');
      }
      
      switch (axiosError.response?.status) {
        case 400:
          return 'Dados inválidos fornecidos';
        case 401:
          return 'Não autorizado. Faça login novamente';
        case 403:
          return 'Acesso negado';
        case 404:
          return 'Recurso não encontrado';
        case 422:
          return 'Dados inválidos';
        case 500:
          return 'Erro interno do servidor';
        case 503:
          return 'Serviço temporariamente indisponível';
        default:
          return 'Erro de rede. Verifique sua conexão';
      }
    }
    
    return 'Erro desconhecido';
  }
}

// Exportar instância singleton
export const apiService = new ApiService();
export default apiService;
