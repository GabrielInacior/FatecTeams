import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// ============================================
// PARAM LISTS
// ============================================

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  EditProfile: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Settings: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Settings: undefined;
};

// ============================================
// NAVIGATION PROP TYPES
// ============================================

// Tipos para as telas de Auth
export type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;
export type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

// Tipos para as telas do App
export type HomeScreenNavigationProp = StackNavigationProp<AppStackParamList, 'Home'>;
export type SettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'SettingsMain'>;
export type EditProfileScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'EditProfile'>;
