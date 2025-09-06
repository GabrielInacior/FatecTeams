import { Colors, lightColors, darkColors } from './colors';
import { dimensions, DimensionsType } from './dimensions';
import { typography, TypographyType } from './typography';

export interface Theme {
  colors: Colors;
  dimensions: DimensionsType;
  typography: TypographyType;
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: lightColors,
  dimensions,
  typography,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: darkColors,
  dimensions,
  typography,
  isDark: true,
};

export type ThemeType = Theme;
