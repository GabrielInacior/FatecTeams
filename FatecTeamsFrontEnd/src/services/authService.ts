import {
    ApiResponse,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User
} from '../types';
import apiService from './api';

class AuthService {
  // ============================================
  // AUTHENTICATION
  // ============================================

  /**
   * Login tradicional com email e senha
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/login', credentials);
      
      if (response.sucesso && response.dados) {
        await apiService.saveAuthData(
          response.dados.accessToken,
          response.dados.refreshToken,
          response.dados.usuario
        );
      }
      
      return response;
    } catch (error: any) {
      // Limpar tokens antigos em caso de erro de autenticação
      if (error?.response?.status === 401) {
        await apiService.clearAuthData();
      }
      
      const errorMessage = apiService.handleError(error);
      
      // Verificar se é erro específico de conta desativada
      if (errorMessage.includes('desativada') || 
          errorMessage.includes('Conta desativada') ||
          (error?.response?.status === 401 && errorMessage.includes('não autorizado'))) {
        throw new Error('Conta desativada. Entre em contato com o suporte ou reative sua conta.');
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Registro de novo usuário
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/registro', userData);
      
      if (response.sucesso && response.dados) {
        await apiService.saveAuthData(
          response.dados.accessToken,
          response.dados.refreshToken,
          response.dados.usuario
        );
      }
      
      return response;
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Login com Google OAuth
   */
  async loginWithGoogle(idToken: string, accessToken?: string): Promise<AuthResponse> {
    try {
      console.log('📡 Enviando para backend:', {
        endpoint: '/auth/google',
        idToken: idToken?.substring(0, 50) + '...',
        accessToken: accessToken?.substring(0, 50) + '...'
      });
      
      const response = await apiService.post<AuthResponse>('/auth/google', {
        idToken,
        accessToken,
      });
      
      console.log('📥 Resposta do backend:', {
        sucesso: response.sucesso,
        mensagem: response.mensagem
      });
      
      if (response.sucesso && response.dados) {
        await apiService.saveAuthData(
          response.dados.accessToken,
          response.dados.refreshToken,
          response.dados.usuario
        );
      }
      
      return response;
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Obter URL de autorização do Google
   */
  async getGoogleAuthUrl(): Promise<{ url: string }> {
    try {
      const response = await apiService.get<ApiResponse<{ url: string }>>('/auth/google/url');
      return response.dados!;
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Login com Microsoft
   */
  async loginWithMicrosoft(accessToken: string): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/microsoft', { accessToken });
      
      if (response.sucesso && response.dados) {
        await apiService.saveAuthData(
          response.dados.accessToken,
          response.dados.refreshToken,
          response.dados.usuario
        );
      }
      
      return response;
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Renovar tokens JWT
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/refresh', { refreshToken });
      
      if (response.sucesso && response.dados) {
        await apiService.saveAuthData(
          response.dados.accessToken,
          response.dados.refreshToken,
          response.dados.usuario
        );
      }
      
      return response;
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Obter informações da sessão atual
   */
  async getSession(): Promise<ApiResponse<{ usuario: User; sessao: any }>> {
    try {
      return await apiService.get<ApiResponse<{ usuario: User; sessao: any }>>('/auth/sessao');
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Validar token atual
   */
  async validateToken(): Promise<{ valido: boolean; usuario?: User }> {
    try {
      const response = await apiService.get<ApiResponse<{ valido: boolean; usuario?: User }>>('/auth/validar');
      return response.dados!;
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      // Tentar fazer logout no servidor, mas não falhar se der erro de autenticação
      await apiService.post('/auth/logout');
    } catch (error: any) {
      // Se o erro for 401 (não autorizado), ignorar pois provavelmente o token já expirou
      if (error?.response?.status !== 401) {
        console.error('Erro ao fazer logout no servidor:', error);
      }
    } finally {
      // Sempre limpar dados locais, independente do resultado do servidor
      await apiService.clearAuthData();
    }
  }

  /**
   * Alterar senha
   */
  async changePassword(senhaAtual: string, novaSenha: string): Promise<ApiResponse> {
    try {
      return await apiService.put<ApiResponse>('/auth/senha', {
        senhaAtual,
        novaSenha,
      });
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Obter informações da sessão
   */
  async getSessionInfo(): Promise<User> {
    try {
      const response = await apiService.get<ApiResponse<User>>('/auth/sessao');
      return response.dados!;
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // USER PROFILE MANAGEMENT
  // ============================================

  /**
   * Solicitar recuperação de senha
   */
  async forgotPassword(email: string): Promise<ApiResponse<string>> {
    try {
      return await apiService.post<ApiResponse<string>>('/usuarios/recuperar-senha', { email });
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Redefinir senha com token
   */
  async resetPassword(token: string, novaSenha: string): Promise<ApiResponse<string>> {
    try {
      return await apiService.post<ApiResponse<string>>('/usuarios/redefinir-senha', { token, novaSenha });
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Obter perfil do usuário
   */
  async getUserProfile(): Promise<ApiResponse<User>> {
    try {
      return await apiService.get<ApiResponse<User>>('/usuarios/perfil');
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateUserProfile(profileData: { nome?: string; telefone?: string }): Promise<ApiResponse<User>> {
    try {
      return await apiService.put<ApiResponse<User>>('/usuarios/perfil', profileData);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Upload de foto de perfil
   */
  async uploadProfilePhoto(imageUri: string, fileName?: string): Promise<ApiResponse<{ foto_perfil: string }>> {
    try {
      const formData = new FormData();
      
      // No React Native, precisamos criar um objeto com uri, type e name
      const imageFile = {
        uri: imageUri,
        type: 'image/jpeg', // ou detectar automaticamente
        name: fileName || 'profile-photo.jpg',
      } as any;
      
      formData.append('foto', imageFile);
      
      return await apiService.post<ApiResponse<{ foto_perfil: string }>>('/usuarios/foto-perfil', formData);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Desativar conta do usuário
   */
  async deactivateAccount(): Promise<ApiResponse<string>> {
    try {
      // Verificar se há token válido antes de fazer a requisição
      const isAuth = await this.isAuthenticated();
      if (!isAuth) {
        throw new Error('Usuário não está autenticado. Faça login novamente.');
      }

      const response = await apiService.delete<ApiResponse<string>>('/usuarios/perfil');
      
      // Limpar dados locais após desativar conta
      await apiService.clearAuthData();
      
      return response;
    } catch (error: any) {
      // Se o erro for de autenticação, limpar dados e retornar erro específico
      if (error?.response?.status === 401) {
        await apiService.clearAuthData();
        throw new Error('Sua sessão expirou. Faça login novamente para desativar sua conta.');
      }
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Reativar conta do usuário
   */
  async reactivateAccount(email: string): Promise<ApiResponse<string>> {
    try {
      const response = await apiService.post<ApiResponse<string>>('/auth/reativar-conta', { email });
      return response;
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // PASSWORD RECOVERY
  // ============================================

  /**
   * Verificar se o usuário está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    return await apiService.isAuthenticated();
  }

  /**
   * Obter dados do usuário armazenados localmente
   */
  async getStoredUser(): Promise<User | null> {
    return await apiService.getStoredUserData();
  }
}

// Exportar instância singleton
export const authService = new AuthService();
export default authService;
