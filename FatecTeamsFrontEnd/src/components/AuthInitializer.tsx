import React, { ReactNode } from 'react';
import { useAuthInit } from '../hooks/useAuth';
import LoadingScreen from './LoadingScreen';

interface AuthInitializerProps {
  children: ReactNode;
}

/**
 * Componente que inicializa os dados de autenticação do usuário
 * antes de renderizar o resto da aplicação
 */
const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const { isLoading, isInitialized } = useAuthInit();

  // Mostra tela de loading enquanto inicializa a autenticação
  if (isLoading || !isInitialized) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

export default AuthInitializer;
