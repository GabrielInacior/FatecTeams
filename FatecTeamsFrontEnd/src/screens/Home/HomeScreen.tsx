import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { FadeInView, ScaleView, SlideUpView } from '../../components/animations/AnimatedComponents';
import Header from '../../components/common/Header';
import { useTheme } from '../../hooks/useTheme';
import { AppDispatch, RootState } from '../../store';
import { fetchGrupos } from '../../store/gruposSlice';
import HomeCardGrupo from './components/HomeCardGrupo';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { grupos } = useSelector((state: RootState) => state.grupos);

  useEffect(() => {
    // Carregar grupos do usuário
    dispatch(fetchGrupos({}));
  }, [dispatch]);

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleGrupos = () => {
    navigation.navigate('Grupos');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const renderUserAvatar = () => {
    if (user?.foto_perfil) {
      return (
        <View style={[styles.avatarContainer, { backgroundColor: theme.colors.card }]}>
          <Image
            source={{ uri: user.foto_perfil }}
            style={styles.avatar}
          />
        </View>
      );
    }
    
    return (
      <View style={[styles.avatarContainer, styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.avatarText}>
          {user?.nome?.charAt(0).toUpperCase() || 'U'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title={getGreeting()}
        subtitle={user?.nome || 'Usuário'}
        leftElement={renderUserAvatar()}
        rightElement={
          <View style={[styles.settingsButton, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="settings-outline" size={20} color={theme.colors.text} />
          </View>
        }
        onRightPress={handleSettings}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <SlideUpView delay={200} style={styles.statsSection}>
          <ScaleView delay={300}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.statIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Ionicons name="people" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                {grupos.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Grupos</Text>
            </View>
          </ScaleView>

          <ScaleView delay={400}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.statIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              </View>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>-</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Tarefas</Text>
            </View>
          </ScaleView>

          <ScaleView delay={500}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.statIcon, { backgroundColor: `${theme.colors.warning}20` }]}>
                <Ionicons name="calendar" size={20} color={theme.colors.warning} />
              </View>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>-</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Eventos</Text>
            </View>
          </ScaleView>
        </SlideUpView>

        {/* Groups Section */}
        <FadeInView delay={600} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Seus Grupos
            </Text>
            <TouchableOpacity style={styles.seeAllButton} onPress={handleGrupos}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                Ver todos
              </Text>
            </TouchableOpacity>
          </View>
          
          {grupos.length > 0 ? (
            grupos.slice(0, 3).map((grupo, index) => (
              <SlideUpView key={grupo.id} delay={700 + (index * 100)}>
                <HomeCardGrupo
                  nome={grupo.nome}
                  membros={grupo._count?.membros || 0}
                  ultimaAtividade={grupo.data_criacao ? 
                    new Date(grupo.data_criacao).toLocaleDateString('pt-BR') : 
                    'Sem atividade'
                  }
                  onPress={() => navigation.navigate('Grupos', {
                    screen: 'GrupoDetalhes',
                    params: { grupoId: grupo.id, grupo }
                  })}
                />
              </SlideUpView>
            ))
          ) : (
            <FadeInView delay={800}>
              <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                  Você ainda não faz parte de nenhum grupo
                </Text>
              </View>
            </FadeInView>
          )}
        </FadeInView>

        {/* Recent Activity */}
        <FadeInView delay={1000} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Atividade Recente
          </Text>
          
          <SlideUpView delay={1100}>
            <View style={[styles.activityContainer, { backgroundColor: theme.colors.card }]}>
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                  <Ionicons name="chatbubble" size={16} color={theme.colors.primary} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                    Nova mensagem no grupo React Native
                  </Text>
                  <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                    Há 15 minutos
                  </Text>
                </View>
              </View>

              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                    Tarefa "Implementar login" concluída
                  </Text>
                  <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                    Há 2 horas
                  </Text>
                </View>
              </View>

              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: `${theme.colors.warning}20` }]}>
                  <Ionicons name="calendar" size={16} color={theme.colors.warning} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                    Evento "Reunião de projeto" adicionado
                  </Text>
                  <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                    Há 1 dia
                  </Text>
                </View>
              </View>
            </View>
          </SlideUpView>
        </FadeInView>

        {/* Quick Actions */}
        <FadeInView delay={1200} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Ações Rápidas
          </Text>
          
          <SlideUpView delay={1300} style={styles.quickActionsContainer}>
            <ScaleView delay={1400}>
              <TouchableOpacity 
                style={[styles.quickActionButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleGrupos}
              >
                <Ionicons name="people-outline" size={24} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Grupos</Text>
              </TouchableOpacity>
            </ScaleView>

            <ScaleView delay={1500}>
              <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.colors.success }]}>
                <Ionicons name="add-outline" size={24} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Nova Tarefa</Text>
              </TouchableOpacity>
            </ScaleView>

            <ScaleView delay={1600}>
              <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.colors.warning }]}>
                <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Novo Evento</Text>
              </TouchableOpacity>
            </ScaleView>
          </SlideUpView>
        </FadeInView>
      </ScrollView>
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
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsButton: {
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
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  seeAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityContainer: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});

export default HomeScreen;
