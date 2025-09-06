import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import GoogleButton from '../../components/GoogleButton';
import { useTheme } from '../../hooks/useTheme';
import googleAuthService from '../../services/googleAuthService';
import { AppDispatch, RootState } from '../../store';
import { clearError, loginAsync, loginWithGoogleAsync } from '../../store/authSlice';
import AuthButton from './components/AuthButton';
import AuthInputField from './components/AuthInputField';
import AuthLayout from './components/AuthLayout';

interface LoginForm {
  email: string;
  senha: string;
}

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  
  const { isLoading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const [form, setForm] = useState<LoginForm>({
    email: '',
    senha: '',
  });

  const [errors, setErrors] = useState<Partial<LoginForm>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigation.navigate('Home');
    }
  }, [isAuthenticated, navigation]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erro', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!form.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (form.senha.length < 6) {
      newErrors.senha = 'Senha deve ter no mínimo 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(loginAsync({
        email: form.email.trim(),
        senha: form.senha,
      })).unwrap();
    } catch (error: any) {
      console.log('🔍 Erro no login:', error);
      
      // Verificar se é erro de conta desativada
      if (typeof error === 'string') {
        if (error.includes('Conta desativada') || error.includes('desativada')) {
          navigation.navigate('AccountDeactivated', { email: form.email.trim() });
          return;
        }
        
        // Verificar se é erro relacionado a token (conta pode estar desativada)
        if (error.includes('Refresh token não encontrado') || 
            error.includes('Token inválido') ||
            error.includes('não autorizado')) {
          // Verificar se o usuário existe mas está desativado
          navigation.navigate('AccountDeactivated', { email: form.email.trim() });
          return;
        }
      }
      
      // Para outros erros, será tratado no useEffect
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log('🚀 Iniciando login com Google...');
      const result = await googleAuthService.signIn();
      console.log('📥 Resultado do Google Auth:', result);
      
      if (result) {
        console.log('🔑 Enviando tokens para backend...');
        await dispatch(loginWithGoogleAsync({
          idToken: result.idToken,
          accessToken: result.accessToken,
        })).unwrap();
        console.log('✅ Login Google concluído com sucesso!');
      } else {
        console.log('❌ Nenhum resultado retornado do Google Auth');
      }
    } catch (error) {
      console.error('❌ Erro no login Google:', error);
      Alert.alert('Erro', 'Falha na autenticação com Google');
    }
  };

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <AuthLayout
      title="Bem-vindo!"
      subtitle="Faça login para acessar sua conta"
    >
      <View style={styles.form}>
        <AuthInputField
          label="Email"
          placeholder="seu@email.com"
          value={form.email}
          onChangeText={(value) => handleInputChange('email', value)}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <AuthInputField
          label="Senha"
          placeholder="Sua senha"
          value={form.senha}
          onChangeText={(value) => handleInputChange('senha', value)}
          error={errors.senha}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
            Esqueceu sua senha?
          </Text>
        </TouchableOpacity>

        <AuthButton
          title="Entrar"
          loading={isLoading}
          onPress={handleLogin}
          style={styles.loginButton}
        />

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
            ou
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        </View>

        <View style={styles.googleButton}>
          <GoogleButton
            onPress={handleGoogleLogin}
            loading={isLoading}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Não tem uma conta?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.registerText, { color: theme.colors.primary }]}>
              Cadastre-se
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  registerText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
