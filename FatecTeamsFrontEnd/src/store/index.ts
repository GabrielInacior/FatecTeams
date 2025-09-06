import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { PersistConfig, persistReducer, persistStore } from 'redux-persist';

// Importar slices
import arquivosReducer from './arquivosSlice';
import authReducer from './authSlice';
import chatReducer from './chatSlice';
import convitesReducer from './convitesSlice';
import eventosReducer from './eventosSlice';
import gruposReducer from './gruposSlice';
import historicoReducer from './historicoSlice';
import notificacoesReducer from './notificacoesSlice';
import relatoriosReducer from './relatoriosSlice';
import tarefasReducer from './tarefasSlice';
import themeReducer from './themeSlice';

// ============================================
// ROOT REDUCER
// ============================================

const rootReducer = combineReducers({
  auth: authReducer,
  theme: themeReducer,
  grupos: gruposReducer,
  chat: chatReducer,
  tarefas: tarefasReducer,
  notificacoes: notificacoesReducer,
  convites: convitesReducer,
  arquivos: arquivosReducer,
  eventos: eventosReducer,
  historico: historicoReducer,
  relatorios: relatoriosReducer,
});

// ============================================
// TYPES
// ============================================

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

// ============================================
// PERSIST CONFIG
// ============================================

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['theme'], // Apenas persistir o tema
};

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  blacklist: ['isLoading', 'error'], // Não persistir estados temporários
};

// ============================================
// STORE CONFIGURATION
// ============================================

const persistedRootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  theme: themeReducer,
  grupos: gruposReducer,
  chat: chatReducer,
  tarefas: tarefasReducer,
  notificacoes: notificacoesReducer,
  convites: convitesReducer,
  arquivos: arquivosReducer,
  eventos: eventosReducer,
  historico: historicoReducer,
  relatorios: relatoriosReducer,
});

export const store = configureStore({
  reducer: persistedRootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/FLUSH',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PERSIST',
          'persist/PURGE',
          'persist/REGISTER',
        ],
      },
    }),
  devTools: __DEV__, // Habilitar Redux DevTools apenas em desenvolvimento
});

export const persistor = persistStore(store);

// ============================================
// STORE ACTIONS
// ============================================

/**
 * Limpar todos os dados persistidos
 */
export const clearPersistedData = () => {
  persistor.purge();
};

/**
 * Resetar store para estado inicial
 */
export const resetStore = () => {
  store.dispatch({ type: 'RESET_STORE' });
};

export default store;
