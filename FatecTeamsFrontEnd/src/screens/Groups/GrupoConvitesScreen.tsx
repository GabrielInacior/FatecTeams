import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import Header from '../../components/common/Header';
import { useTheme } from '../../hooks/useTheme';
import { AppDispatch, RootState } from '../../store';
import convitesService from '../../services/convitesService';

interface Convite {
  id: string;
  codigo: string;
  email: string;
  status: 'pendente' | 'aceito' | 'recusado' | 'expirado';
  data_criacao: string;
  data_expiracao: string;
  data_resposta?: string;
}

const GrupoConvitesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();

  const { grupoId, grupo } = route.params;
  
  const [convites, setConvites] = useState<Convite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  useEffect(() => {
    loadConvites();
  }, []);

  const loadConvites = async () => {
    try {
      setIsLoading(true);
      const response = await convitesService.getConvitesGrupo(grupoId);
      if (response.sucesso && response.dados) {
        setConvites(response.dados);
      }
    } catch (error: any) {
      console.error('Erro ao carregar convites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    if (!newInviteEmail.trim()) {
      Alert.alert('Erro', 'Digite um email válido');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newInviteEmail)) {
      Alert.alert('Erro', 'Digite um email válido');
      return;
    }

    try {
      setIsCreatingInvite(true);
      const response = await convitesService.createConvite({
        grupo_id: grupoId,
        email: newInviteEmail.trim().toLowerCase(),
      });

      if (response.sucesso) {
        Alert.alert('Sucesso', 'Convite enviado com sucesso!');
        setShowCreateModal(false);
        setNewInviteEmail('');
        loadConvites(); // Recarregar lista
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao enviar convite');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleCancelInvite = (convite: Convite) => {
    Alert.alert(
      'Cancelar Convite',
      `Tem certeza que deseja cancelar o convite para ${convite.email}?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          style: 'destructive',
          onPress: async () => {
            try {
              await convitesService.cancelarConvite(convite.codigo);
              Alert.alert('Sucesso', 'Convite cancelado');
              loadConvites(); // Recarregar lista
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao cancelar convite');
            }
          },
        },
      ]
    );
  };

  const handleResendInvite = async (convite: Convite) => {
    try {
      const response = await convitesService.reenviarConvite(convite.codigo);
      if (response.sucesso) {
        Alert.alert('Sucesso', 'Convite reenviado com sucesso!');
        loadConvites(); // Recarregar lista
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao reenviar convite');
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pendente':
        return {
          text: 'Pendente',
          color: theme.colors.warning,
          backgroundColor: `${theme.colors.warning}20`,
          icon: 'time' as const,
        };
      case 'aceito':
        return {
          text: 'Aceito',
          color: theme.colors.success,
          backgroundColor: `${theme.colors.success}20`,
          icon: 'checkmark-circle' as const,
        };
      case 'recusado':
        return {
          text: 'Recusado',
          color: theme.colors.error,
          backgroundColor: `${theme.colors.error}20`,
          icon: 'close-circle' as const,
        };
      case 'expirado':
        return {
          text: 'Expirado',
          color: theme.colors.textSecondary,
          backgroundColor: `${theme.colors.textSecondary}20`,
          icon: 'time-outline' as const,
        };
      default:
        return {
          text: 'Desconhecido',
          color: theme.colors.textSecondary,
          backgroundColor: `${theme.colors.textSecondary}20`,
          icon: 'help-circle' as const,
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isConviteValido = (convite: Convite) => {
    const agora = new Date();
    const dataExpiracao = new Date(convite.data_expiracao);
    return convite.status === 'pendente' && dataExpiracao > agora;
  };

  const renderConvite = ({ item }: { item: Convite }) => {
    const statusInfo = getStatusInfo(item.status);
    const conviteValido = isConviteValido(item);

    return (
      <View style={[styles.conviteCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.conviteHeader}>
          <View style={styles.conviteInfo}>
            <Text style={[styles.conviteEmail, { color: theme.colors.text }]}>
              {item.email}
            </Text>
            <Text style={[styles.conviteDate, { color: theme.colors.textSecondary }]}>
              Enviado em {formatDate(item.data_criacao)}
            </Text>
            <Text style={[styles.conviteExpiration, { color: theme.colors.textSecondary }]}>
              Expira em {formatDate(item.data_expiracao)}
            </Text>
          </View>
          
          <View style={styles.conviteStatus}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
              <Ionicons name={statusInfo.icon} size={12} color={statusInfo.color} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
        </View>

        {item.data_resposta && (
          <Text style={[styles.responseDate, { color: theme.colors.textSecondary }]}>
            Respondido em {formatDate(item.data_resposta)}
          </Text>
        )}

        {conviteValido && (
          <View style={styles.conviteActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}20` }]}
              onPress={() => handleResendInvite(item)}
            >
              <Ionicons name="mail" size={16} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                Reenviar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${theme.colors.error}20` }]}
              onPress={() => handleCancelInvite(item)}
            >
              <Ionicons name="trash" size={16} color={theme.colors.error} />
              <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
        <Ionicons name="mail" size={48} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Nenhum convite enviado
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
        Comece convidando pessoas para participar do grupo
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={[styles.emptyButtonText, { color: theme.colors.white }]}>
          Enviar Primeiro Convite
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Convites"
        subtitle={grupo?.nome}
        leftElement={
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        }
        onLeftPress={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />

      {/* Lista de Convites */}
      <FlatList
        data={convites}
        keyExtractor={(item) => item.id}
        renderItem={renderConvite}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        onRefresh={loadConvites}
        refreshing={isLoading}
      />

      {/* Modal de Criar Convite */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Convidar Membro
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.colors.background }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Ionicons name="close" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
              Digite o email da pessoa que você deseja convidar para o grupo "{grupo?.nome}".
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Email *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }
                ]}
                value={newInviteEmail}
                onChangeText={setNewInviteEmail}
                placeholder="exemplo@email.com"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.background }]}
                onPress={() => setShowCreateModal(false)}
                disabled={isCreatingInvite}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  { 
                    backgroundColor: theme.colors.primary,
                    opacity: isCreatingInvite ? 0.7 : 1
                  }
                ]}
                onPress={handleCreateInvite}
                disabled={isCreatingInvite}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.white }]}>
                  {isCreatingInvite ? 'Enviando...' : 'Enviar Convite'}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  conviteCard: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  conviteInfo: {
    flex: 1,
    marginRight: 12,
  },
  conviteEmail: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  conviteDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  conviteExpiration: {
    fontSize: 12,
  },
  conviteStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  responseDate: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  conviteActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GrupoConvitesScreen;
