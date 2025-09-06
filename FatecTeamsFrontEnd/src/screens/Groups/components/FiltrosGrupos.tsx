import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useTheme } from '../../../hooks/useTheme';

interface FiltrosGruposProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filtros: {
    tipo?: 'projeto' | 'estudo' | 'trabalho';
    privacidade?: 'publico' | 'privado';
    searchTerm?: string;
  }) => void;
  filtrosAtivos: {
    tipo?: 'projeto' | 'estudo' | 'trabalho';
    privacidade?: 'publico' | 'privado';
    searchTerm?: string;
  };
}

const FiltrosGrupos: React.FC<FiltrosGruposProps> = ({
  visible,
  onClose,
  onApply,
  filtrosAtivos,
}) => {
  const { theme } = useTheme();
  const [filtros, setFiltros] = useState(filtrosAtivos);

  const handleApplyFilters = () => {
    onApply(filtros);
    onClose();
  };

  const clearFilters = () => {
    const cleanFilters = {};
    setFiltros(cleanFilters);
    onApply(cleanFilters);
    onClose();
  };

  const setTipo = (tipo?: 'projeto' | 'estudo' | 'trabalho') => {
    setFiltros(prev => ({ ...prev, tipo }));
  };

  const setPrivacidade = (privacidade?: 'publico' | 'privado') => {
    setFiltros(prev => ({ ...prev, privacidade }));
  };

  const tiposOptions = [
    { value: undefined, label: 'Todos os tipos', icon: 'apps' },
    { value: 'projeto' as const, label: 'Projetos', icon: 'code-working' },
    { value: 'estudo' as const, label: 'Estudos', icon: 'book' },
    { value: 'trabalho' as const, label: 'Trabalhos', icon: 'briefcase' },
  ];

  const privacidadeOptions = [
    { value: undefined, label: 'Qualquer privacidade', icon: 'globe' },
    { value: 'publico' as const, label: 'Públicos', icon: 'globe' },
    { value: 'privado' as const, label: 'Privados', icon: 'lock-closed' },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Filtros
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.background }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Busca */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Buscar
            </Text>
            <View style={[styles.searchContainer, { backgroundColor: theme.colors.background }]}>
              <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Nome do grupo..."
                placeholderTextColor={theme.colors.textSecondary}
                value={filtros.searchTerm || ''}
                onChangeText={(text) => setFiltros(prev => ({ ...prev, searchTerm: text }))}
              />
            </View>
          </View>

          {/* Tipo */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Tipo
            </Text>
            <View style={styles.optionsContainer}>
              {tiposOptions.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: filtros.tipo === option.value 
                        ? theme.colors.primary 
                        : theme.colors.background
                    }
                  ]}
                  onPress={() => setTipo(option.value)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={
                      filtros.tipo === option.value 
                        ? theme.colors.white 
                        : theme.colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: filtros.tipo === option.value 
                          ? theme.colors.white 
                          : theme.colors.text
                      }
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Privacidade */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Privacidade
            </Text>
            <View style={styles.optionsContainer}>
              {privacidadeOptions.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: filtros.privacidade === option.value 
                        ? theme.colors.primary 
                        : theme.colors.background
                    }
                  ]}
                  onPress={() => setPrivacidade(option.value)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={
                      filtros.privacidade === option.value 
                        ? theme.colors.white 
                        : theme.colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: filtros.privacidade === option.value 
                          ? theme.colors.white 
                          : theme.colors.text
                      }
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
              onPress={clearFilters}
            >
              <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                Limpar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleApplyFilters}
            >
              <Text style={[styles.actionButtonText, { color: theme.colors.white }]}>
                Aplicar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FiltrosGrupos;
