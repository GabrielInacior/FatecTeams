import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import Header from '../../components/common/Header';
import { useTheme } from '../../hooks/useTheme';
import { AppDispatch, RootState } from '../../store';
import { fetchGrupos } from '../../store/gruposSlice';

// ============================================
// INTERFACES
// ============================================

interface Grupo {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'estudo' | 'trabalho' | 'projeto';
  status: 'ativo' | 'inativo' | 'arquivado';
  data_criacao: string;
  foto_grupo?: string;
  criador_id: string;
  configuracoes?: any;
  membros_count?: number;
  ultima_atividade?: string;
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const GrupoItem: React.FC<{
  grupo: Grupo;
  theme: any;
  onPress: (grupo: Grupo) => void;
}> = ({ grupo, theme, onPress }) => {
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'estudo':
        return 'book-outline';
      case 'trabalho':
        return 'briefcase-outline';
      case 'projeto':
        return 'construct-outline';
      default:
        return 'people-outline';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'estudo':
        return '#4CAF50';
      case 'trabalho':
        return '#2196F3';
      case 'projeto':
        return '#FF9800';
      default:
        return theme.colors.primary;
    }
  };

  const formatUltimaAtividade = (data?: string) => {
    if (!data) return 'Nenhuma atividade';
    
    const agora = new Date();
    const atividade = new Date(data);
    const diffMs = agora.getTime() - atividade.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Agora mesmo';
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`;
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return atividade.toLocaleDateString('pt-BR');
    }
  };

  const renderAvatar = () => {
    if (grupo.foto_grupo) {
      return (
        <Image
          source={{ uri: grupo.foto_grupo }}
          style={styles.grupoAvatar}
        />
      );
    }
    
    return (
      <View style={[
        styles.grupoAvatarPlaceholder, 
        { backgroundColor: getTipoColor(grupo.tipo) }
      ]}>
        <Ionicons 
          name={getTipoIcon(grupo.tipo) as any} 
          size={24} 
          color="#FFFFFF" 
        />
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.grupoItem, { backgroundColor: theme.colors.card }]}
      onPress={() => onPress(grupo)}
      activeOpacity={0.7}
    >
      <View style={styles.grupoItemContent}>
        <View style={styles.grupoHeader}>
          {renderAvatar()}
          
          <View style={styles.grupoInfo}>
            <View style={styles.grupoTitleRow}>
              <Text style={[styles.grupoNome, { color: theme.colors.text }]}>
                {grupo.nome}
              </Text>
              
              <View style={[
                styles.tipoTag,
                { backgroundColor: getTipoColor(grupo.tipo) }
              ]}>
                <Text style={styles.tipoTagText}>
                  {grupo.tipo.toUpperCase()}
                </Text>
              </View>
            </View>
            
            {grupo.descricao && (
              <Text 
                style={[styles.grupoDescricao, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {grupo.descricao}
              </Text>
            )}
            
            <View style={styles.grupoMetadata}>
              <View style={styles.metadataItem}>
                <Ionicons 
                  name="people-outline" 
                  size={14} 
                  color={theme.colors.textSecondary} 
                />
                <Text style={[styles.metadataText, { color: theme.colors.textSecondary }]}>
                  {grupo.membros_count || 0} membros
                </Text>
              </View>
              
              <View style={styles.metadataItem}>
                <Ionicons 
                  name="time-outline" 
                  size={14} 
                  color={theme.colors.textSecondary} 
                />
                <Text style={[styles.metadataText, { color: theme.colors.textSecondary }]}>
                  {formatUltimaAtividade(grupo.ultima_atividade)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.grupoActions}>
          <Ionicons 
            name="chatbubble-outline" 
            size={20} 
            color={theme.colors.primary} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ChatGroupListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();

  const { grupos, isLoading } = useSelector((state: RootState) => state.grupos);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [refreshing, setRefreshing] = useState(false);

  // Filtrar apenas grupos ativos (usando todos os grupos por enquanto)
  const gruposAtivos = grupos;

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    loadGrupos();
  }, []);

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================

  const loadGrupos = async () => {
    try {
      await dispatch(fetchGrupos({ limit: 50, offset: 0 })).unwrap();
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os grupos');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadGrupos();
    } catch (error) {
      console.error('Erro ao atualizar grupos:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGrupoPress = (grupo: Grupo) => {
    navigation.navigate('GrupoChat', {
      grupoId: grupo.id,
      grupo: grupo
    });
  };

  const renderGrupo = ({ item }: { item: Grupo }) => (
    <GrupoItem
      grupo={item}
      theme={theme}
      onPress={handleGrupoPress}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="chatbubbles-outline" 
        size={80} 
        color={theme.colors.textSecondary} 
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Nenhum grupo encontrado
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Você ainda não faz parte de nenhum grupo.{'\n'}
        Peça para ser adicionado ou crie um novo grupo!
      </Text>
      
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreateGroup')}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>
          Criar Grupo
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ============================================
  // RENDER
  // ============================================

  if (isLoading && gruposAtivos.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header
          title="Chat de Grupos"
          leftElement={
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          }
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="chatbubbles-outline" 
            size={80} 
            color={theme.colors.textSecondary} 
          />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Carregando grupos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Chat de Grupos"
        subtitle={`${gruposAtivos.length} grupos disponíveis`}
        leftElement={
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        }
        onLeftPress={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate('CreateGroup')}
          >
            <Ionicons name="add" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={gruposAtivos as any}
        renderItem={renderGrupo}
        keyExtractor={(item) => item.id}
        style={styles.lista}
        contentContainerStyle={styles.listaContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lista: {
    flex: 1,
  },
  listaContent: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
  grupoItem: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  grupoItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grupoHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  grupoAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  grupoAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grupoInfo: {
    flex: 1,
  },
  grupoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  grupoNome: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  tipoTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tipoTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  grupoDescricao: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  grupoMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
  },
  grupoActions: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ChatGroupListScreen;
