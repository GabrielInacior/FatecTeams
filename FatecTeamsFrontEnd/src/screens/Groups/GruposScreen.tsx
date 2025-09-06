import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { FadeInView, SlideUpView } from '../../components/animations/AnimatedComponents';
import Header from '../../components/common/Header';
import { useTheme } from '../../hooks/useTheme';
import { AppDispatch, RootState } from '../../store';
import {
    clearFiltros,
    createGrupo,
    deleteGrupo,
    fetchGrupos,
    setFiltros,
    setSearchTerm,
    updateGrupoAsync
} from '../../store/gruposSlice';
import CreateEditGrupoModal from './components/CreateEditGrupoModal';
import FiltrosGrupos from './components/FiltrosGrupos';
import GrupoCard from './components/GrupoCard';

const GruposScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  
  const { 
    grupos, 
    isLoading, 
    error, 
    searchTerm, 
    filtros 
  } = useSelector((state: RootState) => state.grupos);
  
  const { user } = useSelector((state: RootState) => state.auth);

  const [showFiltros, setShowFiltros] = useState(false);
  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<any>(null);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Carregar grupos ao focar na tela
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchGrupos({}));
    }, [dispatch])
  );

  // Filtrar grupos baseado nos filtros ativos e busca
  const gruposFiltrados = useMemo(() => {
    let result = [...grupos];

    // Filtro por busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(grupo =>
        grupo.nome.toLowerCase().includes(searchLower) ||
        grupo.descricao?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por tipo
    if (filtros.tipo) {
      result = result.filter(grupo => grupo.tipo === filtros.tipo);
    }

    // Filtro por privacidade
    if (filtros.privacidade) {
      result = result.filter(grupo => grupo.privacidade === filtros.privacidade);
    }

    return result;
  }, [grupos, searchTerm, filtros]);

  // Handlers
  const handleRefresh = useCallback(() => {
    dispatch(fetchGrupos({}));
  }, [dispatch]);

  const handleSearch = (text: string) => {
    setLocalSearchTerm(text);
    dispatch(setSearchTerm(text));
  };

  const handleApplyFilters = (newFiltros: any) => {
    dispatch(setFiltros(newFiltros));
  };

  const handleClearFilters = () => {
    setLocalSearchTerm('');
    dispatch(clearFiltros());
  };

  const handleCreateGrupo = () => {
    setEditingGrupo(null);
    setShowCreateEdit(true);
  };

  const handleEditGrupo = (grupo: any) => {
    setEditingGrupo(grupo);
    setShowCreateEdit(true);
  };

  const handleDeleteGrupo = (grupo: any) => {
    Alert.alert(
      'Excluir Grupo',
      `Tem certeza que deseja excluir o grupo "${grupo.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteGrupo(grupo.id));
          },
        },
      ]
    );
  };

  const handleSaveGrupo = async (data: any) => {
    try {
      setIsCreatingGroup(true);
      
      if (editingGrupo) {
        await dispatch(updateGrupoAsync({ 
          grupoId: editingGrupo.id, 
          data 
        })).unwrap();
      } else {
        await dispatch(createGrupo(data)).unwrap();
      }
      
      setShowCreateEdit(false);
      setEditingGrupo(null);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar grupo');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleGrupoPress = (grupo: any) => {
    navigation.navigate('GrupoDetalhes', { grupoId: grupo.id, grupo });
  };

  const canManageGrupo = (grupo: any) => {
    // Usuário pode gerenciar se é criador ou admin
    return grupo.criado_por === user?.id || 
           grupo.membros?.some((m: any) => m.usuario_id === user?.id && ['admin', 'moderador'].includes(m.papel));
  };

  const getUserPapel = (grupo: any) => {
    if (grupo.criado_por === user?.id) return 'admin';
    const membro = grupo.membros?.find((m: any) => m.usuario_id === user?.id);
    return membro?.papel || 'membro';
  };

  const renderEmptyState = () => {
    const hasFilters = searchTerm || filtros.tipo || filtros.privacidade;
    
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
          <Ionicons 
            name={hasFilters ? "search" : "people"} 
            size={48} 
            color={theme.colors.primary} 
          />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          {hasFilters ? 'Nenhum grupo encontrado' : 'Você ainda não tem grupos'}
        </Text>
        <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
          {hasFilters 
            ? 'Tente ajustar os filtros ou criar um novo grupo' 
            : 'Crie seu primeiro grupo para começar a colaborar'
          }
        </Text>
        {hasFilters ? (
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: theme.colors.background }]}
            onPress={handleClearFilters}
          >
            <Text style={[styles.emptyButtonText, { color: theme.colors.text }]}>
              Limpar Filtros
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleCreateGrupo}
          >
            <Text style={[styles.emptyButtonText, { color: theme.colors.white }]}>
              Criar Primeiro Grupo
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderGrupoCard = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeIn.delay(index * 100)}>
      <GrupoCard
        id={item.id}
        nome={item.nome}
        descricao={item.descricao}
        tipo={item.tipo}
        privacidade={item.privacidade}
        totalMembros={item._count?.membros || item.membros?.length || 0}
        papel={getUserPapel(item)}
        ultimaAtividade="Há 2 horas" // TODO: implementar cálculo real
        onPress={() => handleGrupoPress(item)}
        onEdit={canManageGrupo(item) ? () => handleEditGrupo(item) : undefined}
        onDelete={item.criado_por === user?.id ? () => handleDeleteGrupo(item) : undefined}
        canManage={canManageGrupo(item)}
      />
    </Animated.View>
  );

  const filtrosAtivos = useMemo(() => ({
    tipo: filtros.tipo,
    privacidade: filtros.privacidade,
    searchTerm: searchTerm,
  }), [filtros, searchTerm]);

  const hasActiveFilters = searchTerm || filtros.tipo || filtros.privacidade;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FadeInView delay={0}>
        <Header
          title="Grupos"
          subtitle={`${gruposFiltrados.length} ${gruposFiltrados.length === 1 ? 'grupo' : 'grupos'}`}
          rightElement={
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleCreateGrupo}
            >
              <Ionicons name="add" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          }
        />
      </FadeInView>

      {/* Barra de Busca e Filtros */}
      <SlideUpView delay={100} style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Buscar grupos..."
            placeholderTextColor={theme.colors.textSecondary}
            value={localSearchTerm}
            onChangeText={handleSearch}
          />
          {localSearchTerm.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: hasActiveFilters ? theme.colors.primary : theme.colors.card,
            }
          ]}
          onPress={() => setShowFiltros(true)}
        >
          <Ionicons
            name="filter"
            size={20}
            color={hasActiveFilters ? theme.colors.white : theme.colors.text}
          />
          {hasActiveFilters && (
            <View style={[styles.filterBadge, { backgroundColor: theme.colors.white }]}>
              <Text style={[styles.filterBadgeText, { color: theme.colors.primary }]}>
                {Object.values(filtrosAtivos).filter(Boolean).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </SlideUpView>

      {/* Lista de Grupos */}
      <FlatList
        data={gruposFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderGrupoCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
      />

      {/* Modals */}
      <FiltrosGrupos
        visible={showFiltros}
        onClose={() => setShowFiltros(false)}
        onApply={handleApplyFilters}
        filtrosAtivos={filtrosAtivos}
      />

      <CreateEditGrupoModal
        visible={showCreateEdit}
        onClose={() => {
          setShowCreateEdit(false);
          setEditingGrupo(null);
        }}
        onSave={handleSaveGrupo}
        editData={editingGrupo}
        isLoading={isCreatingGroup}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
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
});

export default GruposScreen;
