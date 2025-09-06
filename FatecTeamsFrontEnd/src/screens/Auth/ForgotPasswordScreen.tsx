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
import { forgotPasswordAsync, clearError } from '../../store/authSlice';
import { useTheme } from '../../hooks/useTheme';
import AuthLayout from './components/AuthLayout';
import AuthInputField from './components/AuthInputField';
import AuthButton from './components/AuthButton';

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (error) {
      Alert.alert('Erro', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setEmailError('Email é obrigatório');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email inválido');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const handleForgotPassword = async () => {
    if (!validateEmail(email)) return;

    try {
      const message = await dispatch(forgotPasswordAsync(email.trim())).unwrap();
      setSuccessMessage(message || 'Instruções enviadas para seu email');
      
      Alert.alert(
        'Email Enviado',
        'Verifique sua caixa de entrada para as instruções de recuperação de senha.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      // Error já é tratado no useEffect
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) {
      setEmailError('');
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  return (
    <AuthLayout
      title="Esqueceu a Senha?"
      subtitle="Digite seu email para receber instruções de recuperação"
    >
      <View style={styles.form}>
        <AuthInputField
          label="Email"
          placeholder="seu@email.com"
          value={email}
          onChangeText={handleEmailChange}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {successMessage && (
          <View style={styles.successContainer}>
            <Text style={[styles.successText, { color: theme.colors.success }]}>
              {successMessage}
            </Text>
          </View>
        )}

        <AuthButton
          title="Enviar Instruções"
          loading={isLoading}
          onPress={handleForgotPassword}
          style={styles.sendButton}
        />

        <AuthButton
          title="Voltar ao Login"
          variant="outline"
          onPress={() => navigation.navigate('Login')}
          style={styles.backButton}
        />
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  form: {
    width: '100%',
  },
  successContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  sendButton: {
    marginBottom: 16,
  },
  backButton: {
    marginBottom: 24,
  },
});

export default ForgotPasswordScreen;
