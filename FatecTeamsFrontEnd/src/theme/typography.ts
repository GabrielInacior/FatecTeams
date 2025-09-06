import { Platform } from 'react-native';

export interface Typography {
  // Font Families
  fontFamily: {
    regular: string;
    medium: string;
    semiBold: string;
    bold: string;
  };
  
  // Font Sizes
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  
  // Line Heights
  lineHeight: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  
  // Font Weights
  fontWeight: {
    light: '300';
    regular: '400';
    medium: '500';
    semiBold: '600';
    bold: '700';
    extraBold: '800';
  };
  
  // Text Styles
  h1: {
    fontSize: number;
    lineHeight: number;
    fontWeight: '700';
    fontFamily: string;
  };
  
  h2: {
    fontSize: number;
    lineHeight: number;
    fontWeight: '700';
    fontFamily: string;
  };
  
  h3: {
    fontSize: number;
    lineHeight: number;
    fontWeight: '600';
    fontFamily: string;
  };
  
  h4: {
    fontSize: number;
    lineHeight: number;
    fontWeight: '600';
    fontFamily: string;
  };
  
  h5: {
    fontSize: number;
    lineHeight: number;
    fontWeight: '600';
    fontFamily: string;
  };
  
  h6: {
    fontSize: number;
    lineHeight: number;
    fontWeight: '500';
    fontFamily: string;
  };
  
  body1: {
    fontSize: number;
    lineHeight: number;
    fontWeight: '400';
    fontFamily: string;
  };
  
  body2: {
    fontSize: number;
    lineHeight: number;
    fontWeight: '400';
    fontFamily: string;
  };
  
  caption: {
    fontSize: number;
    lineHeight: number;
    fontWeight: '400';
    fontFamily: string;
  };
  
  button: {
    fontSize: number;
    lineHeight: number;
    fontWeight: '500';
    fontFamily: string;
  };
}

// Definir fontes baseadas na plataforma
const fontFamily = {
  regular: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins_400Regular',
  medium: Platform.OS === 'ios' ? 'Poppins-Medium' : 'Poppins_500Medium',
  semiBold: Platform.OS === 'ios' ? 'Poppins-SemiBold' : 'Poppins_600SemiBold',
  bold: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins_700Bold',
};

export const typography: Typography = {
  fontFamily,
  
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
  },
  
  lineHeight: {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 26,
    xxl: 28,
    xxxl: 32,
  },
  
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
  
  // Heading Styles
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    fontFamily: fontFamily.semiBold,
  },
  
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    fontFamily: fontFamily.semiBold,
  },
  
  h5: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    fontFamily: fontFamily.semiBold,
  },
  
  h6: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
  
  // Body Text Styles
  body1: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: fontFamily.regular,
  },
  
  body2: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: fontFamily.regular,
  },
  
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    fontFamily: fontFamily.regular,
  },
  
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
};

export type TypographyType = typeof typography;
