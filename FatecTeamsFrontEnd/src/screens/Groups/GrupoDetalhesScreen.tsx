import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Image,
    RefreshControl,
    ScrollView,
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
import {
    getGrupoDetalhes,
    getMembrosGrupo,
    leaveGrupo,
    setGrupoAtivo,
} from '../../store/gruposSlice';

const GrupoDetalhesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();

  const { grupoId, grupo: grupoParam } = route.params;
  
  const { 
    grupoDetalhes, 
    membrosGrupoAtivo, 
    isLoading 
  } = useSelector((state: RootState) => state.grupos);
  
  const { user } = useSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);

  // Usar grupo dos params como fallback se detalhes não carregaram ainda
  const grupo = grupoDetalhes || grupoParam;

  useEffect(() => {
    if (grupoId) {
      dispatch(setGrupoAtivo(grupoParam));
      dispatch(getGrupoDetalhes(grupoId));
      dispatch(getMembrosGrupo(grupoId));
    }
  }, [dispatch, grupoId, grupoParam]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(getGrupoDetalhes(grupoId)).unwrap(),
        dispatch(getMembrosGrupo(grupoId)).unwrap(),
      ]);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const userMembro = useMemo(() => {
    return membrosGrupoAtivo.find(m => m.usuario_id === user?.id);
  }, [membrosGrupoAtivo, user?.id]);

  const isCreator = grupo?.criado_por === user?.id;
  const isAdmin = userMembro?.papel === 'admin' || isCreator;
  const isModerador = userMembro?.papel === 'moderador';
  const canManage = isAdmin || isModerador;

  const handleLeaveGroup = () => {
    Alert.alert(
      'Sair do Grupo',
      `Tem certeza que deseja sair do grupo "${grupo?.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(leaveGrupo(grupoId)).unwrap();
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao sair do grupo');
            }
          },
        },
      ]
    );
  };

  const handleSettings = () => {
    navigation.navigate('GrupoConfiguracao', { grupoId, grupo });
  };

  const handleConvites = () => {
    navigation.navigate('GrupoConvites', { grupoId, grupo });
  };

  const handleMembros = () => {
    navigation.navigate('GrupoMembros', { grupoId, grupo, membros: membrosGrupoAtivo });
  };

  const handleChat = () => {
    navigation.navigate('GrupoChat', { grupoId, grupo });
  };

  const handleTarefas = () => {
    navigation.navigate('GrupoTarefas', { grupoId, grupo });
  };

  const handleEventos = () => {
    navigation.navigate('GrupoEventos', { grupoId, grupo });
  };

  const handleArquivos = () => {
    navigation.navigate('GrupoArquivos', { grupoId, grupo });
  };

  const getTipoIcon = () => {
    switch (grupo?.tipo) {
      case 'projeto':
        return 'code-working';
      case 'estudo':
        return 'book';
      case 'trabalho':
        return 'briefcase';
      default:
        return 'people';
    }
  };

  const getTipoColor = () => {
    switch (grupo?.tipo) {
      case 'projeto':
        return theme.colors.primary;
      case 'estudo':
        return theme.colors.success;
      case 'trabalho':
        return theme.colors.warning;
      default:
        return theme.colors.info;
    }
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

  const getMenuOptions = () => {
    const options = [
      {
        icon: 'chatbubbles',
        title: 'Chat',
        subtitle: 'Conversar com o grupo',
        color: theme.colors.primary,
        onPress: handleChat,
      },
      {
        icon: 'checkmark-circle',
        title: 'Tarefas',
        subtitle: 'Gerenciar atividades',
        color: theme.colors.success,
        onPress: handleTarefas,
      },
      {
        icon: 'calendar',
        title: 'Eventos',
        subtitle: 'Agendar reuniões',
        color: theme.colors.warning,
        onPress: handleEventos,
      },
      {
        icon: 'folder',
        title: 'Arquivos',
        subtitle: 'Documentos compartilhados',
        color: theme.colors.info,
        onPress: handleArquivos,
      },
    ];

    if (canManage) {
      options.push({
        icon: 'mail',
        title: 'Convites',
        subtitle: 'Convidar novos membros',
        color: theme.colors.secondary || theme.colors.primary,
        onPress: handleConvites,
      });
    }

    return options;
  };

  if (!grupo) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header
          title="Carregando..."
          leftElement={
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          }
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Carregando detalhes do grupo...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title={grupo.nome}
        leftElement={
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        }
        onLeftPress={() => navigation.goBack()}
        rightElement={
          <View style={styles.headerActions}>
            {canManage && (
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: theme.colors.card }]}
                onPress={handleSettings}
              >
                <Ionicons name="settings" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: theme.colors.card }]}
              onPress={() => {
                // Menu de opções
                const options: any[] = [];
                if (!isCreator) {
                  options.push({
                    text: 'Sair do Grupo',
                    style: 'destructive' as const,
                    onPress: handleLeaveGroup,
                  });
                }
                options.push({ text: 'Cancelar', style: 'cancel' as const });
                
                Alert.alert('Opções', '', options);
              }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Informações do Grupo */}
        <View style={[styles.groupInfoCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.groupHeader}>
            <View style={[styles.groupIcon, { backgroundColor: `${getTipoColor()}20` }]}>
              <Ionicons name={getTipoIcon()} size={32} color={getTipoColor()} />
            </View>
            <View style={styles.groupHeaderInfo}>
              <Text style={[styles.groupName, { color: theme.colors.text }]}>
                {grupo.nome}
              </Text>
              <View style={styles.groupMeta}>
                <View style={[styles.typeBadge, { backgroundColor: `${getTipoColor()}20` }]}>
                  <Text style={[styles.typeText, { color: getTipoColor() }]}>
                    {grupo.tipo?.charAt(0).toUpperCase() + grupo.tipo?.slice(1)}
                  </Text>
                </View>
                <View style={styles.privacyBadge}>
                  <Ionicons 
                    name={grupo.privacidade === 'privado' ? 'lock-closed' : 'globe'} 
                    size={12} 
                    color={theme.colors.textSecondary} 
                  />
                  <Text style={[styles.privacyText, { color: theme.colors.textSecondary }]}>
                    {grupo.privacidade === 'privado' ? 'Privado' : 'Público'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {grupo.descricao && (
            <Text style={[styles.groupDescription, { color: theme.colors.textSecondary }]}>
              {grupo.descricao}
            </Text>
          )}
        </View>

        {/* Estatísticas */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {membrosGrupoAtivo.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Membros
            </Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              0
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Tarefas
            </Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              0
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Eventos
            </Text>
          </View>
        </View>

        {/* Membros Recentes */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Membros
            </Text>
            <TouchableOpacity onPress={handleMembros}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                Ver todos
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersScroll}>
            {membrosGrupoAtivo.slice(0, 10).map((membro) => (
              <View key={membro.id} style={styles.memberItem}>
                {renderMemberAvatar(membro)}
                <Text 
                  style={[styles.memberName, { color: theme.colors.text }]} 
                  numberOfLines={1}
                >
                  {membro.usuario?.nome || 'Usuário'}
                </Text>
                {(membro.papel === 'admin' || membro.papel === 'moderador') && (
                  <View style={[
                    styles.memberBadge,
                    { backgroundColor: membro.papel === 'admin' ? theme.colors.error : theme.colors.warning }
                  ]}>
                    <Text style={styles.memberBadgeText}>
                      {membro.papel === 'admin' ? 'ADMIN' : 'MOD'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            
            {membrosGrupoAtivo.length > 10 && (
              <TouchableOpacity style={styles.seeMoreMembers} onPress={handleMembros}>
                <Text style={[styles.seeMoreText, { color: theme.colors.primary }]}>
                  +{membrosGrupoAtivo.length - 10}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Menu de Opções */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Ferramentas
          </Text>
          
          {getMenuOptions().map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuOption,
                index !== getMenuOptions().length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                }
              ]}
              onPress={option.onPress}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: `${option.color}20` }]}>
                <Ionicons name={option.icon as any} size={24} color={option.color} />
              </View>
              <View style={styles.menuOptionContent}>
                <Text style={[styles.menuOptionTitle, { color: theme.colors.text }]}>
                  {option.title}
                </Text>
                <Text style={[styles.menuOptionSubtitle, { color: theme.colors.textSecondary }]}>
                  {option.subtitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  groupInfoCard: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  groupIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  groupHeaderInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privacyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  groupDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  membersScroll: {
    marginHorizontal: -4,
  },
  memberItem: {
    alignItems: 'center',
    marginHorizontal: 4,
    width: 70,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  memberAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  memberName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  memberBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  memberBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  seeMoreMembers: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    width: 70,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuOptionContent: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuOptionSubtitle: {
    fontSize: 14,
  },
});

export default GrupoDetalhesScreen;
