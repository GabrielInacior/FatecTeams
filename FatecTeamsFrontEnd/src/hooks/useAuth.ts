import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
    getUserProfileAsync,
    loadStoredUserAsync,
    updateUserProfileAsync,
    uploadProfilePhotoAsync,
    validateTokenAsync
} from '../store/authSlice';

/**
 * Hook para gerenciar o carregamento automático dos dados do usuário
 */
export const useAuthInit = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. Primeiro, tenta carregar dados armazenados localmente
        const storedUserResult = await dispatch(loadStoredUserAsync()).unwrap();
        
        if (storedUserResult) {
          // 2. Se há dados locais, valida o token
          try {
            await dispatch(validateTokenAsync()).unwrap();
            
            // 3. Se o token é válido, atualiza os dados do perfil
            await dispatch(getUserProfileAsync()).unwrap();
          } catch (tokenError) {
            console.log('Token inválido, usuário será deslogado automaticamente');
            // O validateTokenAsync já limpa o estado em caso de erro
          }
        }
      } catch (error) {
        console.log('Nenhum usuário armazenado encontrado ou erro ao inicializar');
        // Erro silencioso - usuário não está logado
      }
    };

    initializeAuth();
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized: !isLoading, // Considera inicializado quando não está mais carregando
  };
};

/**
 * Hook para carregar dados do perfil do usuário
 */
export const useUserProfile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading, error } = useSelector((state: RootState) => state.auth);

  const refreshProfile = async () => {
    try {
      await dispatch(getUserProfileAsync()).unwrap();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  const updateProfile = async (profileData: { nome?: string; telefone?: string }) => {
    try {
      const result = await dispatch(updateUserProfileAsync(profileData)).unwrap();
      return result;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  const uploadPhoto = async (imageUri: string, fileName?: string) => {
    try {
      const result = await dispatch(uploadProfilePhotoAsync({ imageUri, fileName })).unwrap();
      return result;
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    error,
    refreshProfile,
    updateProfile,
    uploadPhoto,
  };
};
