import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { RootState } from '../../store';
import { useTheme } from '../../hooks/useTheme';
import Header from '../../components/common/Header';
import HomeCardGrupo from './components/HomeCardGrupo';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  
  const { user } = useSelector((state: RootState) => state.auth);

  const handleSettings = () => {
    navigation.navigate('Settings');
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
        <View style={styles.statsSection}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Ionicons name="people" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>3</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Grupos</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.colors.success}20` }]}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            </View>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>12</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Tarefas</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.colors.warning}20` }]}>
              <Ionicons name="calendar" size={20} color={theme.colors.warning} />
            </View>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>5</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Eventos</Text>
          </View>
        </View>

        {/* Groups Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Seus Grupos
            </Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                Ver todos
              </Text>
            </TouchableOpacity>
          </View>
          
          <HomeCardGrupo
            nome="Grupo de Estudos - React Native"
            membros={12}
            ultimaAtividade="Há 2 horas"
            onPress={() => {}}
          />
          
          <HomeCardGrupo
            nome="Projeto Final - Sistema Web"
            membros={8}
            ultimaAtividade="Há 1 dia"
            onPress={() => {}}
          />
          
          <HomeCardGrupo
            nome="Estudos de Banco de Dados"
            membros={15}
            ultimaAtividade="Há 3 dias"
            onPress={() => {}}
          />
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Atividade Recente
          </Text>
          
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
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Ações Rápidas
          </Text>
          
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Novo Grupo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="add-outline" size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Nova Tarefa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.colors.warning }]}>
              <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Novo Evento</Text>
            </TouchableOpacity>
          </View>
        </View>
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
});

export default HomeScreen;
