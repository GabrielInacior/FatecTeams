import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

interface HomeCardGrupoProps {
  nome: string;
  membros: number;
  ultimaAtividade: string;
  onPress: () => void;
}

const HomeCardGrupo: React.FC<HomeCardGrupoProps> = ({
  nome,
  membros,
  ultimaAtividade,
  onPress,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[styles.nome, { color: theme.colors.text }]} numberOfLines={2}>
          {nome}
        </Text>
        
        <View style={styles.info}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Membros:
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {membros}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Última atividade:
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.primary }]}>
              {ultimaAtividade}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.arrow}>
        <Text style={[styles.arrowText, { color: theme.colors.textSecondary }]}>
          →
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  content: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  arrow: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 18,
  },
});

export default HomeCardGrupo;
