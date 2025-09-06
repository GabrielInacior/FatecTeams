import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import Header from '../../components/common/Header';
import { useTheme } from '../../hooks/useTheme';
import { AppDispatch, RootState } from '../../store';
import { deactivateAccountAsync, logoutAsync } from '../../store/authSlice';
import { toggleTheme } from '../../store/themeSlice';
import SettingsPasswordModal from './components/SettingsPasswordModal';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { theme, isDarkMode } = useTheme();
  
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isDeactivateModalVisible, setIsDeactivateModalVisible] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

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
    setIsDeactivateModalVisible(true);
    setConfirmationText('');
  };

  const confirmDeactivateAccount = async () => {
    if (confirmationText.toUpperCase() !== 'CONFIRMAR') {
      Alert.alert('Erro', 'Digite "CONFIRMAR" para continuar');
      return;
    }

    try {
      setIsDeactivateModalVisible(false);
      await dispatch(deactivateAccountAsync()).unwrap();
      Alert.alert('Conta Desativada', 'Sua conta foi desativada com sucesso.');
    } catch (error: any) {
      // Verificar se é erro de sessão expirada
      if (error.message && error.message.includes('sessão expirou')) {
        Alert.alert(
          'Sessão Expirada',
          'Sua sessão expirou. Você será redirecionado para a tela de login para tentar novamente.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Forçar logout e limpeza do estado
                dispatch(logoutAsync());
              },
            },
          ]
        );
      } else {
        Alert.alert('Erro', error.message || 'Erro ao desativar conta');
      }
    } finally {
      setConfirmationText('');
    }
  };

  const handleLogout = () => {
    setIsLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      setIsLogoutModalVisible(false);
      console.log('🔄 Iniciando logout...');
      
      await dispatch(logoutAsync()).unwrap();
      console.log('✅ Logout realizado com sucesso');
      
      // Navegação será automática quando o estado de autenticação mudar
    } catch (error: any) {
      // Para logout, sempre limpar o estado local mesmo se falhar no servidor
      console.log('⚠️ Logout local realizado, possível erro no servidor:', error);
      
      // Forçar navegação caso não aconteça automaticamente
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 1000);
    }
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
              <View style={[styles.settingsIcon, { backgroundColor: `${theme.colors.textSecondary}20` }]}>
                <Ionicons name="person-remove-outline" size={18} color={theme.colors.textSecondary} />
              </View>
              <Text style={[styles.settingsItemText, { color: theme.colors.textSecondary, fontSize: 14 }]}>
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

      {/* Deactivate Account Modal */}
      <Modal
        visible={isDeactivateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDeactivateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.warningIcon, { backgroundColor: `${theme.colors.error}20` }]}>
                <Ionicons name="warning" size={32} color={theme.colors.error} />
              </View>
              <Text style={[styles.modalTitle, { color: theme.colors.error }]}>
                Desativar Conta
              </Text>
            </View>
            
            <Text style={[styles.modalDescription, { color: theme.colors.text }]}>
              Esta ação é <Text style={{ fontWeight: 'bold' }}>irreversível</Text>. 
              Você perderá acesso permanente a todos os seus dados, grupos, mensagens e arquivos.
            </Text>
            
            <Text style={[styles.modalInstruction, { color: theme.colors.textSecondary }]}>
              Digite "CONFIRMAR" para prosseguir:
            </Text>
            
            <TextInput
              style={[
                styles.confirmationInput, 
                { 
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text 
                }
              ]}
              value={confirmationText}
              onChangeText={setConfirmationText}
              placeholder="CONFIRMAR"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="characters"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.colors.background }]}
                onPress={() => {
                  setIsDeactivateModalVisible(false);
                  setConfirmationText('');
                }}
              >
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.confirmButton, 
                  { 
                    backgroundColor: confirmationText.toUpperCase() === 'CONFIRMAR' 
                      ? theme.colors.error 
                      : theme.colors.textSecondary 
                  }
                ]}
                onPress={confirmDeactivateAccount}
                disabled={confirmationText.toUpperCase() !== 'CONFIRMAR' || isLoading}
              >
                <Text style={[styles.buttonText, { color: theme.colors.white }]}>
                  {isLoading ? 'Processando...' : 'Desativar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={isLogoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.warningIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Ionicons name="log-out-outline" size={32} color={theme.colors.primary} />
              </View>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Confirmar Logout
              </Text>
            </View>
            
            <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
              Tem certeza que deseja sair da sua conta?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.colors.background }]}
                onPress={() => setIsLogoutModalVisible(false)}
              >
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={confirmLogout}
                disabled={isLoading}
              >
                <Text style={[styles.buttonText, { color: theme.colors.white }]}>
                  {isLoading ? 'Saindo...' : 'Sair'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  warningIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInstruction: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmationInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    // Styles applied inline based on state
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
