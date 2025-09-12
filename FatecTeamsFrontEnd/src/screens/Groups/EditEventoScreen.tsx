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
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../../components/common/Header';
import { useTheme } from '../../hooks/useTheme';
import eventosBackendService, { EventoBackend } from '../../services/eventosBackendService';

// ============================================
// INTERFACES
// ============================================

interface RouteParams {
  eventoId: string;
  evento: EventoBackend;
  grupoId: string;
}

interface EditEventoFormData {
  titulo: string;
  descricao: string;
  data_inicio: Date;
  data_fim: Date;
  local: string;
  link_virtual: string;
  tipo_evento: 'reuniao' | 'estudo' | 'prova' | 'apresentacao' | 'aula' | 'deadline' | 'outro';
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const EditEventoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();

  const { eventoId, evento, grupoId } = route.params as RouteParams;

  const [formData, setFormData] = useState<EditEventoFormData>({
    titulo: evento.titulo,
    descricao: evento.descricao || '',
    data_inicio: new Date(evento.data_inicio),
    data_fim: new Date(evento.data_fim),
    local: evento.local || '',
    link_virtual: evento.link_virtual || '',
    tipo_evento: evento.tipo_evento,
    status: evento.status,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================

  const handleInputChange = (field: keyof EditEventoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.titulo.trim()) {
      Alert.alert('Erro', 'O título é obrigatório');
      return false;
    }

    if (formData.data_fim <= formData.data_inicio) {
      Alert.alert('Erro', 'A data de fim deve ser posterior à data de início');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      await eventosBackendService.atualizarEvento(eventoId, {
        ...formData,
        data_inicio: formData.data_inicio.toISOString(),
        data_fim: formData.data_fim.toISOString(),
      });
      
      // Navegar imediatamente sem alert
      navigation.goBack();
      
      // Mostrar toast/alert após navegar
      setTimeout(() => {
        Alert.alert('Sucesso', 'Evento atualizado com sucesso!');
      }, 100);
      
    } catch (error: any) {
      console.error('Erro ao atualizar evento:', error);
      Alert.alert('Erro', error.message || 'Não foi possível atualizar o evento');
    } finally {
      setIsLoading(false);
    }
  };

  const tiposEvento = [
    { value: 'reuniao', label: 'Reunião', icon: 'people' },
    { value: 'estudo', label: 'Estudo', icon: 'library' },
    { value: 'prova', label: 'Prova', icon: 'document-text' },
    { value: 'apresentacao', label: 'Apresentação', icon: 'easel' },
    { value: 'aula', label: 'Aula', icon: 'school' },
    { value: 'deadline', label: 'Prazo', icon: 'alarm' },
    { value: 'outro', label: 'Outro', icon: 'calendar' },
  ];

  const statusOptions = [
    { value: 'agendado', label: 'Agendado', color: theme.colors.primary },
    { value: 'em_andamento', label: 'Em Andamento', color: theme.colors.warning },
    { value: 'concluido', label: 'Concluído', color: theme.colors.success },
    { value: 'cancelado', label: 'Cancelado', color: theme.colors.error },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Editar Evento"
        leftElement={
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        }
        onLeftPress={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={[
              styles.saveButton, 
              { 
                backgroundColor: isLoading ? theme.colors.textSecondary : theme.colors.primary,
              }
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Text>
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Título */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Título *
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }
              ]}
              placeholder="Digite o título do evento"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.titulo}
              onChangeText={(text) => handleInputChange('titulo', text)}
              maxLength={200}
            />
          </View>

          {/* Status */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Status
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusContainer}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor: formData.status === status.value ? status.color : theme.colors.background,
                      borderColor: status.color,
                    }
                  ]}
                  onPress={() => handleInputChange('status', status.value)}
                >
                  <Text style={[
                    styles.statusButtonText,
                    { color: formData.status === status.value ? '#FFFFFF' : status.color }
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tipo */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Tipo do Evento
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tiposContainer}>
              {tiposEvento.map((tipo) => (
                <TouchableOpacity
                  key={tipo.value}
                  style={[
                    styles.tipoButton,
                    {
                      backgroundColor: formData.tipo_evento === tipo.value ? theme.colors.primary : theme.colors.background,
                      borderColor: theme.colors.border,
                    }
                  ]}
                  onPress={() => handleInputChange('tipo_evento', tipo.value)}
                >
                  <Ionicons
                    name={tipo.icon as any}
                    size={20}
                    color={formData.tipo_evento === tipo.value ? '#FFFFFF' : theme.colors.primary}
                  />
                  <Text style={[
                    styles.tipoButtonText,
                    { color: formData.tipo_evento === tipo.value ? '#FFFFFF' : theme.colors.text }
                  ]}>
                    {tipo.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Data e Hora */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Data e Hora *
            </Text>
            
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeColumn}>
                <Text style={[styles.subLabel, { color: theme.colors.textSecondary }]}>Início</Text>
                
                <TouchableOpacity
                  style={[styles.dateTimeButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
                    {formatDate(formData.data_inicio)}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.dateTimeButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
                    {formatTime(formData.data_inicio)}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateTimeColumn}>
                <Text style={[styles.subLabel, { color: theme.colors.textSecondary }]}>Fim</Text>
                
                <TouchableOpacity
                  style={[styles.dateTimeButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
                    {formatDate(formData.data_fim)}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.dateTimeButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
                    {formatTime(formData.data_fim)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Descrição */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Descrição
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }
              ]}
              placeholder="Descreva o evento (opcional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.descricao}
              onChangeText={(text) => handleInputChange('descricao', text)}
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
          </View>

          {/* Local */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Local
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }
              ]}
              placeholder="Local do evento (opcional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.local}
              onChangeText={(text) => handleInputChange('local', text)}
              maxLength={255}
            />
          </View>

          {/* Link Virtual */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Link Virtual
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }
              ]}
              placeholder="Link para reunião virtual (opcional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.link_virtual}
              onChangeText={(text) => handleInputChange('link_virtual', text)}
              maxLength={500}
              keyboardType="url"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* DateTimePickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={formData.data_inicio}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              const newDate = new Date(selectedDate);
              newDate.setHours(formData.data_inicio.getHours());
              newDate.setMinutes(formData.data_inicio.getMinutes());
              handleInputChange('data_inicio', newDate);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={formData.data_fim}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              const newDate = new Date(selectedDate);
              newDate.setHours(formData.data_fim.getHours());
              newDate.setMinutes(formData.data_fim.getMinutes());
              handleInputChange('data_fim', newDate);
            }
          }}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={formData.data_inicio}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowStartTimePicker(false);
            if (selectedTime) {
              const newDate = new Date(formData.data_inicio);
              newDate.setHours(selectedTime.getHours());
              newDate.setMinutes(selectedTime.getMinutes());
              handleInputChange('data_inicio', newDate);
            }
          }}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={formData.data_fim}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowEndTimePicker(false);
            if (selectedTime) {
              const newDate = new Date(formData.data_fim);
              newDate.setHours(selectedTime.getHours());
              newDate.setMinutes(selectedTime.getMinutes());
              handleInputChange('data_fim', newDate);
            }
          }}
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tiposContainer: {
    flexDirection: 'row',
  },
  tipoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  tipoButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateTimeColumn: {
    flex: 1,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
    flex: 1,
  },
});

export default EditEventoScreen;
