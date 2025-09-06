export interface Colors {
  // Primary Colors
  primary: string;
  primaryDark: string;
  primaryLight: string;
  
  // Secondary Colors
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  
  // Background Colors
  background: string;
  surface: string;
  card: string;
  
  // Text Colors
  text: string;
  textSecondary: string;
  textDisabled: string;
  
  // Status Colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Border Colors
  border: string;
  borderLight: string;
  
  // Other Colors
  white: string;
  black: string;
  transparent: string;
  overlay: string;
}

export const lightColors: Colors = {
  // Primary Colors - Azul FatecTeams
  primary: '#1E88E5',
  primaryDark: '#1565C0',
  primaryLight: '#42A5F5',
  
  // Secondary Colors - Verde
  secondary: '#43A047',
  secondaryDark: '#2E7D32',
  secondaryLight: '#66BB6A',
  
  // Background Colors
  background: '#FFFFFF',
  surface: '#F8F9FA',
  card: '#FFFFFF',
  
  // Text Colors
  text: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  
  // Status Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Border Colors
  border: '#E0E0E0',
  borderLight: '#F5F5F5',
  
  // Other Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const darkColors: Colors = {
  // Primary Colors - Azul FatecTeams
  primary: '#42A5F5',
  primaryDark: '#1E88E5',
  primaryLight: '#64B5F6',
  
  // Secondary Colors - Verde
  secondary: '#66BB6A',
  secondaryDark: '#43A047',
  secondaryLight: '#81C784',
  
  // Background Colors
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2C2C2C',
  
  // Text Colors
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textDisabled: '#666666',
  
  // Status Colors
  success: '#66BB6A',
  warning: '#FFB74D',
  error: '#EF5350',
  info: '#42A5F5',
  
  // Border Colors
  border: '#333333',
  borderLight: '#444444',
  
  // Other Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.7)',
};
