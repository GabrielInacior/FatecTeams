import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { useTheme } from '../../../hooks/useTheme';

interface CreateEditGrupoModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    nome: string;
    descricao?: string;
    tipo: 'projeto' | 'estudo' | 'trabalho';
    privacidade: 'publico' | 'privado';
    max_membros?: number;
  }) => void;
  editData?: {
    nome: string;
    descricao?: string;
    tipo: 'projeto' | 'estudo' | 'trabalho';
    privacidade: 'publico' | 'privado';
    max_membros?: number;
  };
  isLoading?: boolean;
}

const CreateEditGrupoModal: React.FC<CreateEditGrupoModalProps> = ({
  visible,
  onClose,
  onSave,
  editData,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const isEdit = !!editData;

  const [formData, setFormData] = useState({
    nome: editData?.nome || '',
    descricao: editData?.descricao || '',
    tipo: editData?.tipo || ('projeto' as const),
    privacidade: editData?.privacidade || ('publico' as const),
    max_membros: editData?.max_membros || undefined,
    hasMaxMembers: !!editData?.max_membros,
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.length < 3) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres';
    } else if (formData.nome.length > 100) {
      newErrors.nome = 'Nome deve ter no máximo 100 caracteres';
    }

    if (formData.descricao && formData.descricao.length > 500) {
      newErrors.descricao = 'Descrição deve ter no máximo 500 caracteres';
    }

    if (formData.hasMaxMembers && formData.max_membros) {
      if (formData.max_membros < 2) {
        newErrors.max_membros = 'Mínimo de 2 membros';
      } else if (formData.max_membros > 1000) {
        newErrors.max_membros = 'Máximo de 1000 membros';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const dataToSave = {
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim() || undefined,
      tipo: formData.tipo,
      privacidade: formData.privacidade,
      max_membros: formData.hasMaxMembers ? formData.max_membros : undefined,
    };

    onSave(dataToSave);
  };

  const tiposOptions = [
    { value: 'projeto' as const, label: 'Projeto', icon: 'code-working', color: theme.colors.primary },
    { value: 'estudo' as const, label: 'Estudo', icon: 'book', color: theme.colors.success },
    { value: 'trabalho' as const, label: 'Trabalho', icon: 'briefcase', color: theme.colors.warning },
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
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {isEdit ? 'Editar Grupo' : 'Criar Novo Grupo'}
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.colors.background }]}
                onPress={onClose}
              >
                <Ionicons name="close" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Nome */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Nome do Grupo *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: errors.nome ? theme.colors.error : theme.colors.border,
                    color: theme.colors.text
                  }
                ]}
                value={formData.nome}
                onChangeText={(text) => setFormData(prev => ({ ...prev, nome: text }))}
                placeholder="Digite o nome do grupo"
                placeholderTextColor={theme.colors.textSecondary}
                maxLength={100}
              />
              {errors.nome && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.nome}
                </Text>
              )}
              <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                {formData.nome.length}/100 caracteres
              </Text>
            </View>

            {/* Descrição */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Descrição
              </Text>
              <TextInput
                style={[
                  styles.textAreaInput,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: errors.descricao ? theme.colors.error : theme.colors.border,
                    color: theme.colors.text
                  }
                ]}
                value={formData.descricao}
                onChangeText={(text) => setFormData(prev => ({ ...prev, descricao: text }))}
                placeholder="Descreva o objetivo do grupo (opcional)"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              {errors.descricao && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.descricao}
                </Text>
              )}
              <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                {formData.descricao.length}/500 caracteres
              </Text>
            </View>

            {/* Tipo */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Tipo *
              </Text>
              <View style={styles.optionsContainer}>
                {tiposOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: formData.tipo === option.value 
                          ? `${option.color}20` 
                          : theme.colors.background,
                        borderColor: formData.tipo === option.value 
                          ? option.color 
                          : theme.colors.border,
                        borderWidth: 1,
                      }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, tipo: option.value }))}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={formData.tipo === option.value ? option.color : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: formData.tipo === option.value 
                            ? option.color 
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
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Privacidade *
              </Text>
              <View style={styles.privacidadeContainer}>
                <TouchableOpacity
                  style={[
                    styles.privacidadeOption,
                    {
                      backgroundColor: formData.privacidade === 'publico' 
                        ? `${theme.colors.success}20` 
                        : theme.colors.background,
                      borderColor: formData.privacidade === 'publico' 
                        ? theme.colors.success 
                        : theme.colors.border,
                    }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, privacidade: 'publico' }))}
                >
                  <Ionicons 
                    name="globe" 
                    size={20} 
                    color={formData.privacidade === 'publico' ? theme.colors.success : theme.colors.textSecondary} 
                  />
                  <View style={styles.privacidadeTexts}>
                    <Text style={[
                      styles.privacidadeTitulo, 
                      { 
                        color: formData.privacidade === 'publico' 
                          ? theme.colors.success 
                          : theme.colors.text 
                      }
                    ]}>
                      Público
                    </Text>
                    <Text style={[styles.privacidadeDescricao, { color: theme.colors.textSecondary }]}>
                      Qualquer pessoa pode encontrar e entrar
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.privacidadeOption,
                    {
                      backgroundColor: formData.privacidade === 'privado' 
                        ? `${theme.colors.warning}20` 
                        : theme.colors.background,
                      borderColor: formData.privacidade === 'privado' 
                        ? theme.colors.warning 
                        : theme.colors.border,
                    }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, privacidade: 'privado' }))}
                >
                  <Ionicons 
                    name="lock-closed" 
                    size={20} 
                    color={formData.privacidade === 'privado' ? theme.colors.warning : theme.colors.textSecondary} 
                  />
                  <View style={styles.privacidadeTexts}>
                    <Text style={[
                      styles.privacidadeTitulo, 
                      { 
                        color: formData.privacidade === 'privado' 
                          ? theme.colors.warning 
                          : theme.colors.text 
                      }
                    ]}>
                      Privado
                    </Text>
                    <Text style={[styles.privacidadeDescricao, { color: theme.colors.textSecondary }]}>
                      Apenas por convite
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Limite de Membros */}
            <View style={styles.section}>
              <View style={styles.switchContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Limitar número de membros
                </Text>
                <Switch
                  value={formData.hasMaxMembers}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    hasMaxMembers: value,
                    max_membros: value ? (prev.max_membros || 10) : undefined
                  }))}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary,
                  }}
                  thumbColor={theme.colors.white}
                />
              </View>
              
              {formData.hasMaxMembers && (
                <View style={styles.maxMembrosContainer}>
                  <TextInput
                    style={[
                      styles.numberInput,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: errors.max_membros ? theme.colors.error : theme.colors.border,
                        color: theme.colors.text
                      }
                    ]}
                    value={formData.max_membros?.toString() || ''}
                    onChangeText={(text) => {
                      const num = parseInt(text) || undefined;
                      setFormData(prev => ({ ...prev, max_membros: num }));
                    }}
                    placeholder="10"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.maxMembrosLabel, { color: theme.colors.textSecondary }]}>
                    membros máximo
                  </Text>
                </View>
              )}
              {errors.max_membros && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.max_membros}
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton, 
                { 
                  backgroundColor: theme.colors.primary,
                  opacity: isLoading ? 0.7 : 1
                }
              ]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={[styles.actionButtonText, { color: theme.colors.white }]}>
                {isLoading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar')}
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
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  container: {
    borderRadius: 20,
    maxHeight: '90%',
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    width: 100,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  privacidadeContainer: {
    gap: 12,
  },
  privacidadeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  privacidadeTexts: {
    flex: 1,
  },
  privacidadeTitulo: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  privacidadeDescricao: {
    fontSize: 14,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  maxMembrosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  maxMembrosLabel: {
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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

export default CreateEditGrupoModal;
