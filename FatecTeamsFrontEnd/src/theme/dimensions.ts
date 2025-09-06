import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const dimensions = {
  // Screen dimensions
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  
  // Spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Margins and Paddings
  margin: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  padding: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  // Border Radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 999,
  },
  
  // Header Heights
  header: {
    height: Platform.OS === 'ios' ? 88 : 64,
    statusBar: Platform.OS === 'ios' ? 44 : 24,
  },
  
  // Tab Bar
  tabBar: {
    height: Platform.OS === 'ios' ? 84 : 60,
  },
  
  // Button Heights
  button: {
    sm: 32,
    md: 44,
    lg: 56,
  },
  
  // Input Heights
  input: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  
  // Icon Sizes
  icon: {
    xs: 12,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
  
  // Avatar Sizes
  avatar: {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
    xxl: 96,
  },
  
  // Card
  card: {
    elevation: 2,
    borderRadius: 8,
    padding: 16,
  },
  
  // Modal
  modal: {
    borderRadius: 16,
    maxWidth: SCREEN_WIDTH * 0.9,
  },
  
  // Bottom Sheet
  bottomSheet: {
    borderRadius: 24,
    minHeight: 200,
  },
} as const;

export type DimensionsType = typeof dimensions;
