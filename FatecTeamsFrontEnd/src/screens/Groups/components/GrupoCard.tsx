import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

import { useTheme } from '../../../hooks/useTheme';

interface GrupoCardProps {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'projeto' | 'estudo' | 'trabalho';
  privacidade: 'publico' | 'privado';
  totalMembros?: number;
  papel?: 'membro' | 'admin' | 'moderador';
  ultimaAtividade?: string;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canManage?: boolean;
}

const GrupoCard: React.FC<GrupoCardProps> = ({
  id,
  nome,
  descricao,
  tipo,
  privacidade,
  totalMembros = 0,
  papel = 'membro',
  ultimaAtividade,
  onPress,
  onEdit,
  onDelete,
  canManage = false,
}) => {
  const { theme } = useTheme();

  const getTipoIcon = () => {
    switch (tipo) {
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
    switch (tipo) {
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

  const getPapelBadgeColor = () => {
    switch (papel) {
      case 'admin':
        return theme.colors.error;
      case 'moderador':
        return theme.colors.warning;
      default:
        return theme.colors.info;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header do Card */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.tipoIcon, { backgroundColor: `${getTipoColor()}20` }]}>
            <Ionicons name={getTipoIcon()} size={20} color={getTipoColor()} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.nome, { color: theme.colors.text }]} numberOfLines={1}>
              {nome}
            </Text>
            <View style={styles.metaInfo}>
              <View style={[styles.tipoBadge, { backgroundColor: `${getTipoColor()}20` }]}>
                <Text style={[styles.tipoText, { color: getTipoColor() }]}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </Text>
              </View>
              <View style={styles.privacidadeContainer}>
                <Ionicons 
                  name={privacidade === 'privado' ? 'lock-closed' : 'globe'} 
                  size={12} 
                  color={theme.colors.textSecondary} 
                />
                <Text style={[styles.privacidadeText, { color: theme.colors.textSecondary }]}>
                  {privacidade === 'privado' ? 'Privado' : 'Público'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Badge do Papel */}
        {papel !== 'membro' && (
          <View style={[styles.papelBadge, { backgroundColor: getPapelBadgeColor() }]}>
            <Text style={styles.papelText}>
              {papel === 'admin' ? 'ADMIN' : 'MOD'}
            </Text>
          </View>
        )}
        
        {/* Menu de Ações */}
        {canManage && (
          <View style={styles.actionsContainer}>
            {onEdit && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}20` }]}
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: `${theme.colors.error}20` }]}
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Descrição */}
      {descricao && (
        <Text 
          style={[styles.descricao, { color: theme.colors.textSecondary }]} 
          numberOfLines={2}
        >
          {descricao}
        </Text>
      )}

      {/* Footer com Estatísticas */}
      <View style={styles.footer}>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Ionicons name="people" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              {totalMembros} {totalMembros === 1 ? 'membro' : 'membros'}
            </Text>
          </View>
          {ultimaAtividade && (
            <View style={styles.stat}>
              <Ionicons name="time" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                {ultimaAtividade}
              </Text>
            </View>
          )}
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  tipoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tipoText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  privacidadeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privacidadeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  papelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  papelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descricao: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default GrupoCard;
