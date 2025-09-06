import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
}

class GoogleAuthService {
  private config: GoogleAuthConfig;

  constructor() {
    
    // Configurações do Google OAuth
    const redirectUri = Platform.OS === 'web' 
      ? 'http://localhost:8081/redirect'  // Web específico
      : AuthSession.makeRedirectUri({     // Mobile
          scheme: 'com.fatecteams.app',
          path: 'redirect'
        });

        console.log('🔍 Generated Redirect URI:', redirectUri);
        
    this.config = {
      clientId: __DEV__ 
        ? '605054897307-lpmmbc4ncbehefm4shg2c0h0nu7hm68q.apps.googleusercontent.com'
        : 'SEU_CLIENT_ID_DE_PRODUCAO.apps.googleusercontent.com',
      redirectUri,
    };
    
    // Log para debug - ver qual URL está sendo usada
    console.log('🔍 Google OAuth Redirect URI:', this.config.redirectUri);
    console.log('🔍 Platform:', Platform.OS);
  }

  /**
   * Iniciar processo de autenticação com Google
   */
  async signIn(): Promise<{ idToken: string; accessToken?: string } | null> {
    try {
      // Log para debug - ver qual URL está sendo usada
      console.log('🔍 Google OAuth Config:', {
        redirectUri: this.config.redirectUri,
        clientId: this.config.clientId,
        platform: Platform.OS
      });
      if (Platform.OS === 'web') {
        return await this.signInWeb();
      } else {
        return await this.signInNative();
      }
    } catch (error) {
      console.error('Erro na autenticação Google:', error);
      throw new Error('Falha na autenticação com Google');
    }
  }

  /**
   * Autenticação Google para web
   */
  private async signInWeb(): Promise<{ idToken: string; accessToken?: string } | null> {
    const codeVerifier = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Crypto.getRandomBytes(32).toString(),
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );

    const codeChallenge = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );

    const request = new AuthSession.AuthRequest({
      clientId: this.config.clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri: this.config.redirectUri,
      codeChallenge,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    });

    if (result.type === 'success' && result.params.code) {
      // Trocar código por tokens
      return await this.exchangeCodeForTokens(result.params.code, codeVerifier);
    }

    return null;
  }

  /**
   * Autenticação Google para mobile (nativo)
   */
  private async signInNative(): Promise<{ idToken: string; accessToken?: string } | null> {
    const request = new AuthSession.AuthRequest({
      clientId: this.config.clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri: this.config.redirectUri,
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    });

    if (result.type === 'success' && result.params.id_token) {
      return {
        idToken: result.params.id_token,
        accessToken: result.params.access_token,
      };
    }

    return null;
  }

  /**
   * Trocar código de autorização por tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<{ idToken: string; accessToken?: string } | null> {
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          code,
          code_verifier: codeVerifier,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }).toString(),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.id_token) {
        return {
          idToken: tokenData.id_token,
          accessToken: tokenData.access_token,
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao trocar código por tokens:', error);
      return null;
    }
  }

  /**
   * Fazer logout (revogar tokens se necessário)
   */
  async signOut(): Promise<void> {
    // Implementar revogação de tokens se necessário
    // Por enquanto, apenas limpar dados locais
  }
}

// Exportar instância singleton
export const googleAuthService = new GoogleAuthService();
export default googleAuthService;
