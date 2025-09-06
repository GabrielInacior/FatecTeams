import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// ============================================
// TYPED HOOKS
// ============================================

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// ============================================
// CUSTOM HOOKS
// ============================================

/**
 * Hook para selecionar dados do store com tipagem automática
 */
export const useTypedSelector = <T>(selector: (state: RootState) => T): T => {
  return useAppSelector(selector);
};

/**
 * Hook para dispatch com tipagem automática
 */
export const useTypedDispatch = () => {
  return useAppDispatch();
};
