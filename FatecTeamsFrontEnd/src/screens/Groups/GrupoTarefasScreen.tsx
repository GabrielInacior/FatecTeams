import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import Header from '../../components/common/Header';
import { useTheme } from '../../hooks/useTheme';
import tarefasService from '../../services/tarefasService';
import { RootState } from '../../store';

// ============================================
// INTERFACES
// ============================================

interface RouteParams {
  grupoId: string;
  grupo: any;
}

interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  status: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  data_vencimento?: string;
  grupo_id: string;
  criador_id: string;
  assignado_para?: string[];
  etiquetas?: string[];
  estimativa_horas?: number;
  horas_trabalhadas?: number;
  data_criacao: string;
  criador_nome?: string;
  assignado_nome?: string;
}

interface FiltrosTarefas {
  status?: string;
  prioridade?: string;
  assignado?: string;
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const TarefaCard: React.FC<{
  tarefa: Tarefa;
  theme: any;
  onPress: () => void;
  onStatusChange: (status: string) => void;
  canEdit: boolean;
}> = ({ tarefa, theme, onPress, onStatusChange, canEdit }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return '#FFA500';
      case 'em_progresso': return '#4285F4';
      case 'concluida': return '#34A853';
      case 'cancelada': return '#EA4335';
      default: return theme.colors.textSecondary;
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa': return '#34A853';
      case 'media': return '#FFA500';
      case 'alta': return '#FF6B35';
      case 'critica': return '#EA4335';
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'em_progresso': return 'Em Progresso';
      case 'concluida': return 'Concluída';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const isVencida = tarefa.data_vencimento && 
    new Date(tarefa.data_vencimento) < new Date() && 
    tarefa.status !== 'concluida';

  return (
    <TouchableOpacity
      style={[
        styles.tarefaCard,
        { backgroundColor: theme.colors.card },
        isVencida && { borderLeftWidth: 4, borderLeftColor: '#EA4335' }
      ]}
      onPress={onPress}
    >
      <View style={styles.tarefaHeader}>
        <View style={styles.tarefaInfo}>
          <Text style={[styles.tarefaTitulo, { color: theme.colors.text }]} numberOfLines={2}>
            {tarefa.titulo}
          </Text>
          {tarefa.descricao && (
            <Text style={[styles.tarefaDescricao, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {tarefa.descricao}
            </Text>
          )}
        </View>
        
        <View style={styles.tarefaActions}>
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: getStatusColor(tarefa.status) + '20' }]}
            onPress={() => canEdit && onStatusChange(tarefa.status)}
            disabled={!canEdit}
          >
            <Text style={[styles.statusText, { color: getStatusColor(tarefa.status) }]}>
              {getStatusText(tarefa.status)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tarefaFooter}>
        <View style={styles.tarefaMeta}>
          <View style={[styles.prioridadeBadge, { backgroundColor: getPrioridadeColor(tarefa.prioridade) + '20' }]}>
            <Text style={[styles.prioridadeText, { color: getPrioridadeColor(tarefa.prioridade) }]}>
              {tarefa.prioridade}
            </Text>
          </View>
          
          {tarefa.data_vencimento && (
            <View style={styles.vencimentoContainer}>
              <Ionicons 
                name="calendar-outline" 
                size={12} 
                color={isVencida ? '#EA4335' : theme.colors.textSecondary} 
              />
              <Text style={[
                styles.vencimentoText, 
                { color: isVencida ? '#EA4335' : theme.colors.textSecondary }
              ]}>
                {formatDate(tarefa.data_vencimento)}
              </Text>
            </View>
          )}
        </View>

        {tarefa.assignado_nome && (
          <View style={styles.assignadoContainer}>
            <Ionicons name="person-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={[styles.assignadoText, { color: theme.colors.textSecondary }]}>
              {tarefa.assignado_nome}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const FiltrosModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onApply: (filtros: FiltrosTarefas) => void;
  filtrosAtivos: FiltrosTarefas;
  theme: any;
}> = ({ visible, onClose, onApply, filtrosAtivos, theme }) => {
  const [filtros, setFiltros] = useState<FiltrosTarefas>(filtrosAtivos);

  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'em_progresso', label: 'Em Progresso' },
    { value: 'concluida', label: 'Concluída' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  const prioridadeOptions = [
    { value: '', label: 'Todas' },
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' },
    { value: 'critica', label: 'Crítica' }
  ];

  const handleApply = () => {
    onApply(filtros);
    onClose();
  };

  const handleClear = () => {
    setFiltros({});
    onApply({});
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Filtros
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Status</Text>
              <View style={styles.filterOptions}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      { 
                        backgroundColor: filtros.status === option.value 
                          ? theme.colors.primary + '20' 
                          : theme.colors.background 
                      }
                    ]}
                    onPress={() => setFiltros(prev => ({ ...prev, status: option.value }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { 
                        color: filtros.status === option.value 
                          ? theme.colors.primary 
                          : theme.colors.text 
                      }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Prioridade</Text>
              <View style={styles.filterOptions}>
                {prioridadeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      { 
                        backgroundColor: filtros.prioridade === option.value 
                          ? theme.colors.primary + '20' 
                          : theme.colors.background 
                      }
                    ]}
                    onPress={() => setFiltros(prev => ({ ...prev, prioridade: option.value }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { 
                        color: filtros.prioridade === option.value 
                          ? theme.colors.primary 
                          : theme.colors.text 
                      }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.background }]}
              onPress={handleClear}
            >
              <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                Limpar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleApply}
            >
              <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                Aplicar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const GrupoTarefasScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { theme } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);

  const { grupoId, grupo } = route.params as RouteParams;

  // Estados
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState<FiltrosTarefas>({});
  const [showFiltros, setShowFiltros] = useState(false);

  // Carregar tarefas
  const loadTarefas = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        status: filtros.status,
        prioridade: filtros.prioridade,
        assignado_para: filtros.assignado
      };
      
      const response = await tarefasService.getTarefasGrupo(grupoId, params);
      if (response.sucesso) {
        setTarefas(response.dados || []);
      }
    } catch (error: any) {
      console.error('Erro ao carregar tarefas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as tarefas');
    } finally {
      setIsLoading(false);
    }
  }, [grupoId, filtros]);

  // Recarregar quando a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      loadTarefas();
    }, [loadTarefas])
  );

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTarefas();
    } finally {
      setRefreshing(false);
    }
  };

  const handleTarefaPress = (tarefa: Tarefa) => {
    // TODO: Navegar para detalhes da tarefa
    console.log('Tarefa selecionada:', tarefa.id);
  };

  const handleStatusChange = async (tarefa: Tarefa, novoStatus: string) => {
    try {
      let response;
      switch (novoStatus) {
        case 'em_progresso':
          response = await tarefasService.iniciarTarefa(tarefa.id);
          break;
        case 'concluida':
          response = await tarefasService.concluirTarefa(tarefa.id);
          break;
        case 'cancelada':
          response = await tarefasService.cancelarTarefa(tarefa.id);
          break;
        default:
          return;
      }

      if (response.sucesso) {
        await loadTarefas();
      }
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      Alert.alert('Erro', 'Não foi possível alterar o status da tarefa');
    }
  };

  const handleCreateTarefa = () => {
    navigation.navigate('CreateTarefa', { grupoId, grupo });
  };

  const handleApplyFiltros = (novosFiltros: FiltrosTarefas) => {
    setFiltros(novosFiltros);
  };

  const canEditTarefa = (tarefa: Tarefa) => {
    return tarefa.criador_id === user?.id || (tarefa.assignado_para?.includes(user?.id || '') ?? false);
  };

  // Filtrar tarefas por busca
  const tarefasFiltradas = tarefas.filter(tarefa =>
    searchTerm === '' ||
    tarefa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tarefa.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSubtitle = () => {
    const total = tarefasFiltradas.length;
    const concluidas = tarefasFiltradas.filter(t => t.status === 'concluida').length;
    return `${total} tarefas • ${concluidas} concluídas`;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primary + '20' }]}>
        <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Nenhuma tarefa encontrada
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
        {searchTerm || Object.keys(filtros).length > 0
          ? 'Tente ajustar os filtros ou termo de busca'
          : 'Crie sua primeira tarefa para começar a organizar o trabalho da equipe'
        }
      </Text>
    </View>
  );

  const renderTarefaItem = ({ item }: { item: Tarefa }) => (
    <TarefaCard
      tarefa={item}
      theme={theme}
      onPress={() => handleTarefaPress(item)}
      onStatusChange={(status) => {
        // Mostrar opções de status
        const nextStatus = status === 'pendente' ? 'em_progresso' : 
                          status === 'em_progresso' ? 'concluida' : 'pendente';
        handleStatusChange(item, nextStatus);
      }}
      canEdit={canEditTarefa(item)}
    />
  );

  const hasActiveFilters = Object.values(filtros).some(value => value && value !== '');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Tarefas"
        subtitle={getSubtitle()}
        leftElement={
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        }
        onLeftPress={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleCreateTarefa}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Barra de busca e filtros */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Buscar tarefas..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: theme.colors.card },
            hasActiveFilters && { backgroundColor: theme.colors.primary + '20' }
          ]}
          onPress={() => setShowFiltros(true)}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={hasActiveFilters ? theme.colors.primary : theme.colors.textSecondary} 
          />
          {hasActiveFilters && (
            <View style={[styles.filterBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.filterBadgeText}>•</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Lista de tarefas */}
      <FlatList
        data={tarefasFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderTarefaItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
      />

      {/* Modal de filtros */}
      <FiltrosModal
        visible={showFiltros}
        onClose={() => setShowFiltros(false)}
        onApply={handleApplyFiltros}
        filtrosAtivos={filtros}
        theme={theme}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  tarefaCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tarefaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tarefaInfo: {
    flex: 1,
    marginRight: 12,
  },
  tarefaTitulo: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tarefaDescricao: {
    fontSize: 14,
    lineHeight: 20,
  },
  tarefaActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tarefaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tarefaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prioridadeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prioridadeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  vencimentoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vencimentoText: {
    fontSize: 12,
  },
  assignadoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assignadoText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
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
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GrupoTarefasScreen;
