import { StackNavigationProp } from '@react-navigation/stack';

// ============================================
// PARAM LISTS
// ============================================

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  AccountDeactivated: { email: string };
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  EditProfile: undefined;
};

export type GruposStackParamList = {
  GruposMain: undefined;
  GrupoDetalhes: {
    grupoId: string;
    grupo: any;
  };
  GrupoMembros: {
    grupoId: string;
    grupo: any;
    membros?: any[];
  };
  GrupoConvites: {
    grupoId: string;
    grupo: any;
  };
};

export type AppTabParamList = {
  Home: undefined;
  Grupos: undefined;
  Settings: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Grupos: undefined;
  Settings: undefined;
};

// ============================================
// NAVIGATION PROP TYPES
// ============================================

// Tipos para as telas de Auth
export type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;
export type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
export type AccountDeactivatedScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'AccountDeactivated'>;

// Tipos para as telas do App
export type HomeScreenNavigationProp = StackNavigationProp<AppStackParamList, 'Home'>;
export type SettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'SettingsMain'>;
export type EditProfileScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'EditProfile'>;
