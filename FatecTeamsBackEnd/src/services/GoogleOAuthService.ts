import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';

export interface IGoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
}

export class GoogleOAuthService {
    private client: OAuth2Client;

    constructor() {
        this.client = new OAuth2Client(
            config.oauth.google.clientId,
            config.oauth.google.clientSecret,
            config.oauth.google.redirectUri
        );
    }

    // ============================================
    // VALIDAR TOKEN ID DO GOOGLE
    // ============================================

    public async verificarTokenId(idToken: string): Promise<IGoogleUserInfo | null> {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken: idToken,
                audience: config.oauth.google.clientId
            });

            const payload = ticket.getPayload();

            if (!payload) {
                throw new Error('Payload do token inválido');
            }

            // Verificar se o email está verificado
            if (!payload.email_verified) {
                throw new Error('Email não verificado no Google');
            }

            return {
                id: payload.sub!,
                email: payload.email!,
                verified_email: payload.email_verified!,
                name: payload.name!,
                given_name: payload.given_name!,
                family_name: payload.family_name!,
                picture: payload.picture!,
                locale: payload.locale || 'pt-BR'
            };

        } catch (error) {
            console.error('Erro ao verificar token do Google:', error);
            return null;
        }
    }

    // ============================================
    // OBTER INFORMAÇÕES DO USUÁRIO VIA ACCESS TOKEN
    // ============================================

    public async obterInformacoesUsuario(accessToken: string): Promise<IGoogleUserInfo | null> {
        try {
            // Configurar o access token
            this.client.setCredentials({ access_token: accessToken });

            // Fazer requisição para a API do Google
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro na API do Google: ${response.status}`);
            }

            const userInfo: any = await response.json();

            return {
                id: userInfo.id,
                email: userInfo.email,
                verified_email: userInfo.verified_email,
                name: userInfo.name,
                given_name: userInfo.given_name,
                family_name: userInfo.family_name,
                picture: userInfo.picture,
                locale: userInfo.locale || 'pt-BR'
            };

        } catch (error) {
            console.error('Erro ao obter informações do usuário Google:', error);
            return null;
        }
    }

    // ============================================
    // GERAR URL DE AUTORIZAÇÃO
    // ============================================

    public gerarUrlAutorizacao(state?: string): string {
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ];

        return this.client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: state,
            prompt: 'consent'
        });
    }

    // ============================================
    // TROCAR CÓDIGO POR TOKENS
    // ============================================

    public async trocarCodigoPorTokens(code: string): Promise<{
        access_token: string;
        refresh_token?: string;
        id_token?: string;
    } | null> {
        try {
            const { tokens } = await this.client.getToken(code);
            
            return {
                access_token: tokens.access_token!,
                refresh_token: tokens.refresh_token || undefined,
                id_token: tokens.id_token || undefined
            };

        } catch (error) {
            console.error('Erro ao trocar código por tokens:', error);
            return null;
        }
    }

    // ============================================
    // REFRESH TOKEN
    // ============================================

    public async renovarAccessToken(refreshToken: string): Promise<string | null> {
        try {
            this.client.setCredentials({ refresh_token: refreshToken });
            
            const { credentials } = await this.client.refreshAccessToken();
            
            return credentials.access_token || null;

        } catch (error) {
            console.error('Erro ao renovar access token:', error);
            return null;
        }
    }

    // ============================================
    // REVOGAR TOKEN
    // ============================================

    public async revogarToken(accessToken: string): Promise<boolean> {
        try {
            await this.client.revokeToken(accessToken);
            return true;

        } catch (error) {
            console.error('Erro ao revogar token:', error);
            return false;
        }
    }
}
