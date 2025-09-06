import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import { useTheme } from '../../hooks/useTheme';
import authService from '../../services/authService';

interface AccountDeactivatedScreenProps {
  route: {
    params: {
      email: string;
    };
  };
}

const AccountDeactivatedScreen: React.FC<AccountDeactivatedScreenProps> = ({ route }) => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const { email } = route.params;

  const handleReactivateAccount = async () => {
    Alert.alert(
      'Reativar Conta',
      'Tem certeza de que deseja reativar sua conta? Você poderá fazer login normalmente após a reativação.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Reativar',
          style: 'default',
          onPress: async () => {
            setIsLoading(true);
            try {
              const response = await authService.reactivateAccount(email);
              if (response.sucesso) {
                Alert.alert(
                  'Conta Reativada!',
                  'Sua conta foi reativada com sucesso. Você pode fazer login normalmente agora.',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.navigate('Login'),
                    },
                  ]
                );
              } else {
                Alert.alert('Erro', response.mensagem || 'Falha ao reativar conta');
              }
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível reativar a conta. Tente novamente.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Suporte',
      'Para entrar em contato com o suporte:\n\nEmail: fatecteams@gmail.com\n\nEles poderão ajudá-lo com questões relacionadas à sua conta.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Conta Desativada"
        leftElement={
          <TouchableOpacity onPress={handleBackToLogin}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        }
        onLeftPress={handleBackToLogin}
      />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconBackground, { backgroundColor: `${theme.colors.error}20` }]}>
            <Ionicons name="lock-closed" size={64} color={theme.colors.error} />
          </View>
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          Conta Desativada
        </Text>

        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          Sua conta ({email}) está atualmente desativada ou não pôde ser acessada.
        </Text>

        <Text style={[styles.instructions, { color: theme.colors.textSecondary }]}>
          Você pode escolher uma das opções abaixo:
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleReactivateAccount}
            disabled={isLoading}
          >
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.white} />
            <Text style={[styles.primaryButtonText, { color: theme.colors.white }]}>
              {isLoading ? 'Reativando...' : 'Reativar Conta'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={handleContactSupport}
          >
            <Ionicons name="help-circle" size={24} color={theme.colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
              Falar com Suporte
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ghostButton]}
            onPress={handleBackToLogin}
          >
            <Text style={[styles.ghostButtonText, { color: theme.colors.textSecondary }]}>
              Voltar ao Login
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.warningContainer}>
          <Ionicons name="information-circle" size={20} color={theme.colors.warning} />
          <Text style={[styles.warningText, { color: theme.colors.textSecondary }]}>
            Se você reativar sua conta, poderá fazer login normalmente e ter acesso a todos os seus dados.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  ghostButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  ghostButtonText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});

export default AccountDeactivatedScreen;
