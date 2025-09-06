import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { AppDispatch, RootState } from '../../store';
import { registerAsync, clearError } from '../../store/authSlice';
import { useTheme } from '../../hooks/useTheme';
import AuthLayout from './components/AuthLayout';
import AuthInputField from './components/AuthInputField';
import AuthButton from './components/AuthButton';

interface RegisterForm {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  telefone?: string;
}

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  
  const { isLoading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const [form, setForm] = useState<RegisterForm>({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
  });

  const [errors, setErrors] = useState<Partial<RegisterForm>>({});

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
    const newErrors: Partial<RegisterForm> = {};

    if (!form.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (form.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter no mínimo 2 caracteres';
    }

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

    if (!form.confirmarSenha.trim()) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (form.senha !== form.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não conferem';
    }

    if (form.telefone && form.telefone.trim()) {
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!phoneRegex.test(form.telefone)) {
        newErrors.telefone = 'Telefone deve estar no formato (11) 99999-9999';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(registerAsync({
        nome: form.nome.trim(),
        email: form.email.trim(),
        senha: form.senha,
        telefone: form.telefone?.trim() || undefined,
      })).unwrap();
    } catch (error) {
      // Error já é tratado no useEffect
    }
  };

  const handleInputChange = (field: keyof RegisterForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatPhone = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 11) {
      const formatted = numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
      return formatted;
    }
    return text;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    handleInputChange('telefone', formatted);
  };

  return (
    <AuthLayout
      title="Criar Conta"
      subtitle="Preencha os dados para criar sua conta"
    >
      <View style={styles.form}>
        <AuthInputField
          label="Nome completo"
          placeholder="Seu nome completo"
          value={form.nome}
          onChangeText={(value) => handleInputChange('nome', value)}
          error={errors.nome}
          autoCapitalize="words"
          autoCorrect={false}
        />

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
          label="Telefone (opcional)"
          placeholder="(11) 99999-9999"
          value={form.telefone}
          onChangeText={handlePhoneChange}
          error={errors.telefone}
          keyboardType="phone-pad"
          maxLength={15}
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

        <AuthInputField
          label="Confirmar senha"
          placeholder="Confirme sua senha"
          value={form.confirmarSenha}
          onChangeText={(value) => handleInputChange('confirmarSenha', value)}
          error={errors.confirmarSenha}
          secureTextEntry
          autoCapitalize="none"
        />

        <AuthButton
          title="Criar Conta"
          loading={isLoading}
          onPress={handleRegister}
          style={styles.registerButton}
        />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Já tem uma conta?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.loginText, { color: theme.colors.primary }]}>
              Fazer login
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
  registerButton: {
    marginBottom: 24,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  loginText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
