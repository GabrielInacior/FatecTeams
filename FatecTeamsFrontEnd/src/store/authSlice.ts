import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState, LoginRequest, RegisterRequest } from '../types';
import authService from '../services/authService';

// ============================================
// INITIAL STATE
// ============================================

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Fazer login
 */
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Fazer registro
 */
export const registerAsync = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Fazer login com Google
 */
export const loginWithGoogleAsync = createAsyncThunk(
  'auth/loginWithGoogle',
  async ({ idToken, accessToken }: { idToken: string; accessToken?: string }, { rejectWithValue }) => {
    try {
      const response = await authService.loginWithGoogle(idToken, accessToken);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Validar token e obter dados do usuário
 */
export const validateTokenAsync = createAsyncThunk(
  'auth/validateToken',
  async (_, { rejectWithValue }) => {
    try {
      const result = await authService.validateToken();
      if (!result.valido || !result.usuario) {
        return rejectWithValue('Token inválido');
      }
      return result.usuario;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Fazer logout
 */
export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error) {
      // Mesmo se falhar, vamos limpar o estado local
      return null;
    }
  }
);

/**
 * Alterar senha
 */
export const changePasswordAsync = createAsyncThunk(
  'auth/changePassword',
  async ({ senhaAtual, novaSenha }: { senhaAtual: string; novaSenha: string }, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(senhaAtual, novaSenha);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.mensagem;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Fazer registro via API de registro
 */
export const registerViaAuthAsync = createAsyncThunk(
  'auth/registerAuth',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Fazer login com Microsoft
 */
export const loginWithMicrosoftAsync = createAsyncThunk(
  'auth/loginWithMicrosoft',
  async (accessToken: string, { rejectWithValue }) => {
    try {
      const response = await authService.loginWithMicrosoft(accessToken);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Renovar tokens JWT
 */
export const refreshTokenAsync = createAsyncThunk(
  'auth/refreshToken',
  async (refreshToken: string, { rejectWithValue }) => {
    try {
      const response = await authService.refreshToken(refreshToken);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Obter informações da sessão atual
 */
export const getSessionAsync = createAsyncThunk(
  'auth/getSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getSession();
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Solicitar recuperação de senha
 */
export const forgotPasswordAsync = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(email);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.mensagem;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Redefinir senha com token
 */
export const resetPasswordAsync = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, novaSenha }: { token: string; novaSenha: string }, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(token, novaSenha);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.mensagem;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Obter perfil do usuário
 */
export const getUserProfileAsync = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getUserProfile();
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Atualizar perfil do usuário
 */
export const updateUserProfileAsync = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData: { nome?: string; telefone?: string }, { rejectWithValue }) => {
    try {
      const response = await authService.updateUserProfile(profileData);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Upload de foto de perfil
 */
export const uploadProfilePhotoAsync = createAsyncThunk(
  'auth/uploadProfilePhoto',
  async (photo: File, { rejectWithValue }) => {
    try {
      const response = await authService.uploadProfilePhoto(photo);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Desativar conta do usuário
 */
export const deactivateAccountAsync = createAsyncThunk(
  'auth/deactivateAccount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.deactivateAccount();
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.mensagem;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

/**
 * Recuperar dados do usuário armazenados
 */
export const loadStoredUserAsync = createAsyncThunk(
  'auth/loadStoredUser',
  async (_, { rejectWithValue }) => {
    try {
      const [user, isAuthenticated] = await Promise.all([
        authService.getStoredUser(),
        authService.isAuthenticated(),
      ]);

      if (!user || !isAuthenticated) {
        return rejectWithValue('Dados não encontrados');
      }

      return user;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }
);

// ============================================
// SLICE
// ============================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
    
    // Atualizar dados do usuário
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    // Reset do estado
    resetAuthState: () => initialState,
  },
  extraReducers: (builder) => {
    // ============================================
    // LOGIN
    // ============================================
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.usuario;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // ============================================
    // REGISTER
    // ============================================
    builder
      .addCase(registerAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.usuario;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // ============================================
    // GOOGLE LOGIN
    // ============================================
    builder
      .addCase(loginWithGoogleAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithGoogleAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.usuario;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginWithGoogleAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // ============================================
    // VALIDATE TOKEN
    // ============================================
    builder
      .addCase(validateTokenAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(validateTokenAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(validateTokenAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      });

    // ============================================
    // LOGOUT
    // ============================================
    builder
      .addCase(logoutAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        return initialState;
      })
      .addCase(logoutAsync.rejected, (state) => {
        // Mesmo se falhar, limpar o estado
        return initialState;
      });

    // ============================================
    // CHANGE PASSWORD
    // ============================================
    builder
      .addCase(changePasswordAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePasswordAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePasswordAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ============================================
    // UPDATE USER PROFILE
    // ============================================
    builder
      .addCase(updateUserProfileAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfileAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfileAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ============================================
    // UPLOAD PROFILE PHOTO
    // ============================================
    builder
      .addCase(uploadProfilePhotoAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadProfilePhotoAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(uploadProfilePhotoAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ============================================
    // LOAD STORED USER
    // ============================================
    builder
      .addCase(loadStoredUserAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredUserAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loadStoredUserAsync.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

// ============================================
// EXPORTS
// ============================================

export const { clearError, updateUser, resetAuthState } = authSlice.actions;
export default authSlice.reducer;
