import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import Header from '../../components/common/Header';
import { useTheme } from '../../hooks/useTheme';
import tarefasService from '../../services/tarefasService';
import { RootState } from '../../store';

// ============================================
// INTERFACES
// ============================================

interface RouteParams {
  grupoId: string;
  grupo: any;
}

interface CreateTarefaForm {
  titulo: string;
  descricao: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  data_vencimento?: Date;
  estimativa_horas?: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const CreateTarefaScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { theme } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);

  const { grupoId, grupo } = route.params as RouteParams;

  // Estados do formulário
  const [form, setForm] = useState<CreateTarefaForm>({
    titulo: '',
    descricao: '',
    prioridade: 'media',
    data_vencimento: undefined,
    estimativa_horas: undefined,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Opções de prioridade
  const prioridadeOptions = [
    { value: 'baixa', label: 'Baixa', color: '#34A853' },
    { value: 'media', label: 'Média', color: '#FFA500' },
    { value: 'alta', label: 'Alta', color: '#FF6B35' },
    { value: 'critica', label: 'Crítica', color: '#EA4335' },
  ];

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!form.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    } else if (form.titulo.length < 3) {
      newErrors.titulo = 'Título deve ter pelo menos 3 caracteres';
    }

    if (form.descricao && form.descricao.length > 2000) {
      newErrors.descricao = 'Descrição deve ter no máximo 2000 caracteres';
    }

    if (form.estimativa_horas && (form.estimativa_horas < 0 || form.estimativa_horas > 999)) {
      newErrors.estimativa_horas = 'Estimativa deve estar entre 0 e 999 horas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleInputChange = (field: keyof CreateTarefaForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('data_vencimento', selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const tarefaData = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || undefined,
        prioridade: form.prioridade,
        data_vencimento: form.data_vencimento?.toISOString(),
        estimativa_horas: form.estimativa_horas,
      };

      const response = await tarefasService.createTarefa(grupoId, tarefaData);

      if (response.sucesso) {
        // Navegar de volta
        navigation.goBack();
        
        // Mostrar mensagem de sucesso após a navegação
        setTimeout(() => {
          Alert.alert('Sucesso', 'Tarefa criada com sucesso!');
        }, 100);
      }
    } catch (error: any) {
      console.error('Erro ao criar tarefa:', error);
      Alert.alert('Erro', error.message || 'Não foi possível criar a tarefa');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Nova Tarefa"
        subtitle={grupo?.nome}
        leftElement={
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        }
        onLeftPress={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={[
              styles.submitButton,
              { 
                backgroundColor: theme.colors.primary,
                opacity: isLoading ? 0.6 : 1
              }
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Criando...' : 'Criar'}
            </Text>
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Título */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Título *
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: errors.titulo ? '#EA4335' : 'transparent'
                }
              ]}
              placeholder="Digite o título da tarefa"
              placeholderTextColor={theme.colors.textSecondary}
              value={form.titulo}
              onChangeText={(value) => handleInputChange('titulo', value)}
              maxLength={200}
            />
            {errors.titulo && (
              <Text style={[styles.errorText, { color: '#EA4335' }]}>
                {errors.titulo}
              </Text>
            )}
          </View>

          {/* Descrição */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Descrição
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: errors.descricao ? '#EA4335' : 'transparent'
                }
              ]}
              placeholder="Descreva os detalhes da tarefa"
              placeholderTextColor={theme.colors.textSecondary}
              value={form.descricao}
              onChangeText={(value) => handleInputChange('descricao', value)}
              multiline
              numberOfLines={4}
              maxLength={2000}
            />
            {errors.descricao && (
              <Text style={[styles.errorText, { color: '#EA4335' }]}>
                {errors.descricao}
              </Text>
            )}
            <Text style={[styles.characterCount, { color: theme.colors.textSecondary }]}>
              {form.descricao.length}/2000 caracteres
            </Text>
          </View>

          {/* Prioridade */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Prioridade
            </Text>
            <View style={styles.prioridadeContainer}>
              {prioridadeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.prioridadeOption,
                    {
                      backgroundColor: form.prioridade === option.value
                        ? option.color + '20'
                        : theme.colors.card,
                      borderColor: form.prioridade === option.value
                        ? option.color
                        : 'transparent'
                    }
                  ]}
                  onPress={() => handleInputChange('prioridade', option.value)}
                >
                  <Text
                    style={[
                      styles.prioridadeText,
                      {
                        color: form.prioridade === option.value
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

          {/* Data de Vencimento */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Data de Vencimento
            </Text>
            <TouchableOpacity
              style={[styles.dateInput, { backgroundColor: theme.colors.card }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={[
                styles.dateText,
                { 
                  color: form.data_vencimento 
                    ? theme.colors.text 
                    : theme.colors.textSecondary 
                }
              ]}>
                {form.data_vencimento 
                  ? formatDate(form.data_vencimento)
                  : 'Selecionar data'
                }
              </Text>
              {form.data_vencimento && (
                <TouchableOpacity
                  onPress={() => handleInputChange('data_vencimento', undefined)}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* Estimativa de Horas */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Estimativa de Horas
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: errors.estimativa_horas ? '#EA4335' : 'transparent'
                }
              ]}
              placeholder="Ex: 8"
              placeholderTextColor={theme.colors.textSecondary}
              value={form.estimativa_horas?.toString() || ''}
              onChangeText={(value) => {
                const numValue = value ? parseFloat(value) : undefined;
                handleInputChange('estimativa_horas', numValue);
              }}
              keyboardType="numeric"
            />
            {errors.estimativa_horas && (
              <Text style={[styles.errorText, { color: '#EA4335' }]}>
                {errors.estimativa_horas}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={form.data_vencimento || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  prioridadeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  prioridadeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  prioridadeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
  },
});

export default CreateTarefaScreen;
