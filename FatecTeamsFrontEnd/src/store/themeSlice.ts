import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeState, ThemeMode } from '../types';

// ============================================
// INITIAL STATE
// ============================================

const initialState: ThemeState = {
  mode: 'light',
  colors: {},
};

// ============================================
// SLICE
// ============================================

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    // Alternar tema
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    
    // Definir tema específico
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
    },
    
    // Definir cores customizadas
    setColors: (state, action: PayloadAction<Record<string, string>>) => {
      state.colors = action.payload;
    },
  },
});

// ============================================
// EXPORTS
// ============================================

export const { toggleTheme, setTheme, setColors } = themeSlice.actions;
export default themeSlice.reducer;
