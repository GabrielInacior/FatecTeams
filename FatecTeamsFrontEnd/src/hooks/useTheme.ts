import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { lightTheme, darkTheme, Theme } from '../theme';

export const useTheme = () => {
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const isDarkMode = themeMode === 'dark';
  const theme: Theme = isDarkMode ? darkTheme : lightTheme;

  return {
    theme,
    isDarkMode,
  };
};
