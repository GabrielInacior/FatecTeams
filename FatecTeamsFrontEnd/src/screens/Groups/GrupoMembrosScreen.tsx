import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    StyleSheet,
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
import {
    getMembrosGrupo,
    removeMembroGrupo,
    updateMembroPapel,
} from '../../store/gruposSlice';

const GrupoMembrosScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();

  const { grupoId, grupo, membros: membrosParam } = route.params;
  
  const { membrosGrupoAtivo, isLoading } = useSelector((state: RootState) => state.grupos);
  const { user } = useSelector((state: RootState) => state.auth);

  const membros = membrosGrupoAtivo.length > 0 ? membrosGrupoAtivo : membrosParam || [];
  
  const [searchTerm, setSearchTerm] = useState('');

  const userMembro = useMemo(() => {
    return membros.find((m: any) => m.usuario_id === user?.id);
  }, [membros, user?.id]);

  const isCreator = grupo?.criado_por === user?.id;
  const isAdmin = userMembro?.papel === 'admin' || isCreator;
  const isModerador = userMembro?.papel === 'moderador';
  const canManageMembers = isAdmin || isModerador;

  const membrosFiltrados = useMemo(() => {
    if (!searchTerm) return membros;
    
    const searchLower = searchTerm.toLowerCase();
    return membros.filter((membro: any) =>
      membro.usuario?.nome?.toLowerCase().includes(searchLower) ||
      membro.usuario?.email?.toLowerCase().includes(searchLower)
    );
  }, [membros, searchTerm]);

  const membrosOrdenados = useMemo(() => {
    return [...membrosFiltrados].sort((a, b) => {
      // Criador primeiro
      if (a.usuario_id === grupo?.criado_por) return -1;
      if (b.usuario_id === grupo?.criado_por) return 1;
      
      // Depois admins
      if (a.papel === 'admin' && b.papel !== 'admin') return -1;
      if (b.papel === 'admin' && a.papel !== 'admin') return 1;
      
      // Depois moderadores
      if (a.papel === 'moderador' && b.papel === 'membro') return -1;
      if (b.papel === 'moderador' && a.papel === 'membro') return 1;
      
      // Por último, ordem alfabética
      return (a.usuario?.nome || '').localeCompare(b.usuario?.nome || '');
    });
  }, [membrosFiltrados, grupo?.criado_por]);

  const handleRemoveMember = (membro: any) => {
    if (membro.usuario_id === user?.id) {
      Alert.alert('Erro', 'Você não pode remover a si mesmo');
      return;
    }

    if (membro.usuario_id === grupo?.criado_por) {
      Alert.alert('Erro', 'Não é possível remover o criador do grupo');
      return;
    }

    Alert.alert(
      'Remover Membro',
      `Tem certeza que deseja remover ${membro.usuario?.nome} do grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeMembroGrupo({
                grupoId,
                usuarioId: membro.usuario_id
              })).unwrap();
              
              // Recarregar membros
              dispatch(getMembrosGrupo(grupoId));
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao remover membro');
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = (membro: any) => {
    if (membro.usuario_id === user?.id && !isCreator) {
      Alert.alert('Erro', 'Você não pode alterar seu próprio cargo');
      return;
    }

    if (membro.usuario_id === grupo?.criado_por) {
      Alert.alert('Erro', 'Não é possível alterar o cargo do criador');
      return;
    }

    const options = [
      {
        text: 'Membro',
        onPress: () => updateRole(membro, 'membro'),
      },
      {
        text: 'Moderador',
        onPress: () => updateRole(membro, 'moderador'),
      },
    ];

    if (isAdmin) {
      options.splice(1, 0, {
        text: 'Admin',
        onPress: () => updateRole(membro, 'admin'),
      });
    }

    options.push({ text: 'Cancelar', style: 'cancel' } as any);

    Alert.alert(
      'Alterar Cargo',
      `Selecione o novo cargo para ${membro.usuario?.nome}`,
      options
    );
  };

  const updateRole = async (membro: any, novoPapel: 'membro' | 'admin' | 'moderador') => {
    if (membro.papel === novoPapel) return;

    try {
      await dispatch(updateMembroPapel({
        grupoId,
        usuarioId: membro.usuario_id,
        papel: novoPapel
      })).unwrap();
      
      // Recarregar membros
      dispatch(getMembrosGrupo(grupoId));
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao alterar cargo');
    }
  };

  const handleInviteMembers = () => {
    navigation.navigate('GrupoConvites', { grupoId, grupo });
  };

  const renderMemberAvatar = (membro: any) => {
    if (membro.usuario?.foto_perfil) {
      return (
        <Image
          source={{ uri: membro.usuario.foto_perfil }}
          style={styles.memberAvatar}
        />
      );
    }
    
    return (
      <View style={[styles.memberAvatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.memberAvatarText}>
          {membro.usuario?.nome?.charAt(0).toUpperCase() || 'U'}
        </Text>
      </View>
    );
  };

  const getRoleBadge = (papel: string, isGroupCreator: boolean) => {
    if (isGroupCreator) {
      return {
        text: 'CRIADOR',
        color: theme.colors.primary,
        backgroundColor: `${theme.colors.primary}20`,
      };
    }

    switch (papel) {
      case 'admin':
        return {
          text: 'ADMIN',
          color: theme.colors.error,
          backgroundColor: `${theme.colors.error}20`,
        };
      case 'moderador':
        return {
          text: 'MOD',
          color: theme.colors.warning,
          backgroundColor: `${theme.colors.warning}20`,
        };
      default:
        return null;
    }
  };

  const canModifyMember = (membro: any) => {
    // Não pode modificar criador
    if (membro.usuario_id === grupo?.criado_por) return false;
    
    // Não pode modificar a si mesmo (exceto criador)
    if (membro.usuario_id === user?.id && !isCreator) return false;
    
    // Admin pode modificar qualquer um (exceto criador)
    if (isAdmin) return true;
    
    // Moderador pode modificar apenas membros comuns
    if (isModerador && membro.papel === 'membro') return true;
    
    return false;
  };

  const renderMember = ({ item }: { item: any }) => {
    const badge = getRoleBadge(item.papel, item.usuario_id === grupo?.criado_por);
    const canModify = canModifyMember(item);

    return (
      <View style={[styles.memberCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.memberInfo}>
          {renderMemberAvatar(item)}
          <View style={styles.memberDetails}>
            <Text style={[styles.memberName, { color: theme.colors.text }]}>
              {item.usuario?.nome || 'Nome não disponível'}
            </Text>
            <Text style={[styles.memberEmail, { color: theme.colors.textSecondary }]}>
              {item.usuario?.email || 'Email não disponível'}
            </Text>
            <Text style={[styles.memberJoinDate, { color: theme.colors.textSecondary }]}>
              Membro desde {new Date(item.data_ingresso).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
        
        <View style={styles.memberActions}>
          {badge && (
            <View style={[styles.roleBadge, { backgroundColor: badge.backgroundColor }]}>
              <Text style={[styles.roleBadgeText, { color: badge.color }]}>
                {badge.text}
              </Text>
            </View>
          )}
          
          {canModify && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}20` }]}
                onPress={() => handleChangeRole(item)}
              >
                <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: `${theme.colors.error}20` }]}
                onPress={() => handleRemoveMember(item)}
              >
                <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.textSecondary}20` }]}>
        <Ionicons name="people" size={48} color={theme.colors.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {searchTerm ? 'Nenhum membro encontrado' : 'Nenhum membro'}
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
        {searchTerm 
          ? 'Tente buscar por outro termo' 
          : 'Este grupo ainda não tem membros'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Membros"
        subtitle={`${membros.length} ${membros.length === 1 ? 'membro' : 'membros'}`}
        leftElement={
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        }
        onLeftPress={() => navigation.goBack()}
        rightElement={
          canManageMembers ? (
            <TouchableOpacity
              style={[styles.inviteButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleInviteMembers}
            >
              <Ionicons name="person-add" size={20} color={theme.colors.white} />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Barra de Busca */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Buscar membros..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista de Membros */}
      <FlatList
        data={membrosOrdenados}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inviteButton: {
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  memberJoinDate: {
    fontSize: 12,
  },
  memberActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});

export default GrupoMembrosScreen;
