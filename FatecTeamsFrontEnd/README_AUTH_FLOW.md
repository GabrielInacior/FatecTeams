# FatecTeams Frontend - Fluxo de Autenticação

## 📁 Estrutura de Arquivos

```
src/
├── screens/
│   ├── Auth/
│   │   ├── components/
│   │   │   ├── AuthInputField.tsx      # Campo de input personalizado
│   │   │   ├── AuthButton.tsx          # Botão personalizado  
│   │   │   └── AuthLayout.tsx          # Layout base para telas auth
│   │   ├── LoginScreen.tsx             # 🔐 Tela de login
│   │   ├── RegisterScreen.tsx          # 📝 Tela de cadastro
│   │   └── ForgotPasswordScreen.tsx    # 🔑 Tela esqueceu senha
│   ├── Home/
│   │   ├── components/
│   │   │   └── HomeCardGrupo.tsx       # Card de grupo na home
│   │   └── HomeScreen.tsx              # 🏠 Tela home placeholder
│   ├── Settings/
│   │   ├── components/
│   │   │   └── SettingsPasswordModal.tsx # Modal alterar senha
│   │   └── SettingsScreen.tsx          # ⚙️ Tela de configurações
│   └── index.ts                        # Exportações das telas
├── hooks/
│   └── useTheme.ts                     # Hook para tema
├── navigation/
│   └── RootNavigator.tsx               # Navegação (exemplo)
└── AppExample.tsx                      # App exemplo
```

## 🎯 Funcionalidades Implementadas

### ✅ Telas de Autenticação
- **LoginScreen**: Login com email/senha, validação, navegação para esqueceu senha e registro
- **RegisterScreen**: Cadastro com nome, email, telefone, senha e confirmação  
- **ForgotPasswordScreen**: Recuperação de senha por email

### ✅ Tela Principal  
- **HomeScreen**: Dashboard com informações do usuário, lista de grupos, placeholder

### ✅ Configurações
- **SettingsScreen**: Perfil, alteração de tema (dark/light), logout
- **SettingsPasswordModal**: Modal para alterar senha

## 🎨 Design System

### Componentes Reutilizáveis
- `AuthInputField`: Campo de input com label, erro, validação
- `AuthButton`: Botão com variantes (primary, secondary, outline)
- `AuthLayout`: Layout padrão para telas de auth
- `HomeCardGrupo`: Card para exibir grupos na home
- `SettingsPasswordModal`: Modal para alteração de senha

### Temas
- **Cores**: Usando `theme/colors.ts` com suporte a dark/light mode
- **Dimensões**: Sistema de espaçamento consistente em `theme/dimensions.ts` 
- **Typography**: Tipografia padronizada em `theme/typography.ts`

## 🔧 Como Usar

### 1. Importar as telas
```typescript
import { 
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  HomeScreen,
  SettingsScreen 
} from './screens';
```

### 2. Usar com Redux Store
```typescript
import { Provider } from 'react-redux';
import { store, persistor } from './store';

<Provider store={store}>
  <PersistGate loading={null} persistor={persistor}>
    <LoginScreen />
  </PersistGate>
</Provider>
```

### 3. Implementar Navegação
Para navegação completa, instale as dependências:

```bash
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
```

Depois use o `RootNavigator.tsx` como exemplo.

## 📋 Funcionalidades das Telas

### 🔐 LoginScreen
- Validação de email e senha
- Integração com Redux (loginAsync)
- Navegação para registro e esqueceu senha
- Loading states e tratamento de erro
- Armazenamento de sessão

### 📝 RegisterScreen  
- Campos: nome, email, telefone, senha, confirmação
- Validação completa do formulário
- Formatação automática de telefone
- Integração com registerAsync
- Navegação para login

### 🔑 ForgotPasswordScreen
- Campo de email com validação
- Integração com forgotPasswordAsync
- Feedback visual de sucesso/erro
- Navegação para login

### 🏠 HomeScreen
- Exibição dos dados do usuário
- Lista de grupos (placeholder)
- Navegação para configurações
- Botão de logout
- Cards reutilizáveis

### ⚙️ SettingsScreen
- Seções organizadas (Perfil, Aparência, Outros)
- Toggle para dark/light mode
- Modal para alterar senha
- Integração com Redux store
- Logout com confirmação

## 🎨 Padrões de Nomenclatura

Seguindo o padrão solicitado:
- **Telas**: `NomeScreen.tsx`
- **Componentes**: `PrefixoNomeComponente.tsx`
  - Exemplo: `HomeCardGrupo`, `SettingsPasswordModal`
- **Hooks**: `useNomeHook.ts`
- **Organização**: Por funcionalidade em pastas

## 🔄 Estados Redux Integrados

Todas as telas usam os slices Redux:
- **authSlice**: Login, register, logout, alteração de senha
- **themeSlice**: Toggle dark/light mode  
- Tratamento completo de loading states
- Persistência de dados do usuário
- Limpeza de erros automática

## 🚀 Próximos Passos

1. **Instalar dependências de navegação** se necessário
2. **Implementar splash screen** durante carregamento
3. **Adicionar mais funcionalidades** nas telas de configuração
4. **Implementar telas de grupos** e outras funcionalidades
5. **Adicionar testes** para os componentes

---

**Desenvolvido seguindo clean code, boas práticas de React Native e integração completa com Redux Toolkit! 🎉**
