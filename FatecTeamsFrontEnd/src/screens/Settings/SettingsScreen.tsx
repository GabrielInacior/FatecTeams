import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../../store';
import { toggleTheme } from '../../store/themeSlice';
import { logoutAsync, deactivateAccountAsync } from '../../store/authSlice';
import { useTheme } from '../../hooks/useTheme';
import Header from '../../components/common/Header';
import SettingsPasswordModal from './components/SettingsPasswordModal';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { theme, isDarkMode } = useTheme();
  
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    setIsPasswordModalVisible(true);
  };

  const handleAbout = () => {
    Alert.alert(
      'FatecTeams',
      'Versão 1.0.0\n\nAplicativo para gerenciamento de equipes e projetos acadêmicos da FATEC.\n\nDesenvolvido com React Native e Expo.',
      [{ text: 'OK' }]
    );
  };

  const handleDeactivateAccount = () => {
    Alert.alert(
      'Desativar Conta',
      'Tem certeza que deseja desativar sua conta? Esta ação não pode ser desfeita e você perderá acesso a todos os seus dados.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deactivateAccountAsync()).unwrap();
              Alert.alert('Conta Desativada', 'Sua conta foi desativada com sucesso.');
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao desativar conta');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirmar Logout',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logoutAsync()).unwrap();
            } catch (error) {
              // Error handling se necessário
            }
          },
        },
      ]
    );
  };

  const renderUserAvatar = () => {
    if (user?.foto_perfil) {
      return (
        <Image
          source={{ uri: user.foto_perfil }}
          style={styles.userAvatar}
        />
      );
    }
    
    return (
      <View style={[styles.userAvatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.userAvatarText}>
          {user?.nome?.charAt(0).toUpperCase() || 'U'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header
        title="Configurações"
        leftElement={
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        }
        onLeftPress={handleGoBack}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <TouchableOpacity 
          style={[styles.userSection, { backgroundColor: theme.colors.card }]}
          onPress={handleEditProfile}
        >
          <View style={styles.userInfo}>
            {renderUserAvatar()}
            <View style={styles.userTextInfo}>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {user?.nome || 'Usuário'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                {user?.email || 'email@exemplo.com'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Account Settings */}
        <View style={[styles.settingsSection, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Conta
          </Text>
          
          <TouchableOpacity
            style={[styles.settingsItem, { borderBottomColor: theme.colors.border }]}
            onPress={handleEditProfile}
          >
            <View style={styles.settingsItemLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.settingsItemText, { color: theme.colors.text }]}>
                Editar Perfil
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={handleChangePassword}
          >
            <View style={styles.settingsItemLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: `${theme.colors.warning}20` }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.warning} />
              </View>
              <Text style={[styles.settingsItemText, { color: theme.colors.text }]}>
                Alterar Senha
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Appearance Settings */}
        <View style={[styles.settingsSection, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Aparência
          </Text>
          
          <View style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={theme.colors.success} />
              </View>
              <Text style={[styles.settingsItemText, { color: theme.colors.text }]}>
                Modo Escuro
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleThemeToggle}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={theme.colors.white}
            />
          </View>
        </View>

        {/* Support & Info */}
        <View style={[styles.settingsSection, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Suporte e Informações
          </Text>
          
          <TouchableOpacity
            style={[styles.settingsItem, { borderBottomColor: theme.colors.border }]}
            onPress={handleAbout}
          >
            <View style={styles.settingsItemLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: `${theme.colors.info}20` }]}>
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.info} />
              </View>
              <Text style={[styles.settingsItemText, { color: theme.colors.text }]}>
                Sobre o App
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => Alert.alert('Em desenvolvimento', 'Funcionalidade será implementada em breve')}
          >
            <View style={styles.settingsItemLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: `${theme.colors.info}20` }]}>
                <Ionicons name="help-circle-outline" size={20} color={theme.colors.info} />
              </View>
              <Text style={[styles.settingsItemText, { color: theme.colors.text }]}>
                Central de Ajuda
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => Alert.alert('Em desenvolvimento', 'Funcionalidade será implementada em breve')}
          >
            <View style={styles.settingsItemLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: `${theme.colors.info}20` }]}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.info} />
              </View>
              <Text style={[styles.settingsItemText, { color: theme.colors.text }]}>
                Fale Conosco
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={[styles.settingsSection, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Zona de Perigo
          </Text>
          
          <TouchableOpacity
            style={[styles.settingsItem, { borderBottomColor: theme.colors.border }]}
            onPress={handleDeactivateAccount}
            disabled={isLoading}
          >
            <View style={styles.settingsItemLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: `${theme.colors.error}20` }]}>
                <Ionicons name="person-remove-outline" size={20} color={theme.colors.error} />
              </View>
              <Text style={[styles.settingsItemText, { color: theme.colors.error }]}>
                Desativar Conta
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={handleLogout}
            disabled={isLoading}
          >
            <View style={styles.settingsItemLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: `${theme.colors.error}20` }]}>
                <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
              </View>
              <Text style={[styles.settingsItemText, { color: theme.colors.error }]}>
                Sair da Conta
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Password Modal */}
      <SettingsPasswordModal
        visible={isPasswordModalVisible}
        onClose={() => setIsPasswordModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  userAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  settingsSection: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    padding: 20,
    paddingBottom: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingsItemText: {
    fontSize: 16,
    flex: 1,
  },
});

export default SettingsScreen;
