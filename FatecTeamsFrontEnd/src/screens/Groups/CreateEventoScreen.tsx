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
import eventosBackendService, { CreateEventoBackendData } from '../../services/eventosBackendService';

// ============================================
// INTERFACES
// ============================================

interface RouteParams {
  grupoId: string;
  grupo: any;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const CreateEventoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();

  const { grupoId, grupo } = route.params as RouteParams;

  const [formData, setFormData] = useState<CreateEventoBackendData>({
    titulo: '',
    descricao: '',
    data_inicio: new Date().toISOString(),
    data_fim: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hora depois
    local: '',
    link_virtual: '',
    tipo_evento: 'reuniao',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'inicio' | 'fim' | null>(null);

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================

  const handleInputChange = (field: keyof CreateEventoBackendData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(null);
    
    if (selectedDate) {
      const isoString = selectedDate.toISOString();
      if (showDatePicker === 'inicio') {
        setFormData(prev => ({
          ...prev,
          data_inicio: isoString,
          // Se a data de fim for antes da nova data de início, ajustar
          data_fim: new Date(isoString).getTime() >= new Date(prev.data_fim).getTime() 
            ? new Date(new Date(isoString).getTime() + 60 * 60 * 1000).toISOString()
            : prev.data_fim
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          data_fim: isoString
        }));
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const validateForm = (): boolean => {
    if (!formData.titulo.trim()) {
      Alert.alert('Erro', 'Título é obrigatório');
      return false;
    }

    if (new Date(formData.data_fim) <= new Date(formData.data_inicio)) {
      Alert.alert('Erro', 'Data de fim deve ser posterior à data de início');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      await eventosBackendService.criarEvento(grupoId, formData);
      
      // Navegar imediatamente sem alert
      navigation.goBack();
      
      // Mostrar toast/alert após navegar (setTimeout para garantir que a navegação ocorra primeiro)
      setTimeout(() => {
        Alert.alert('Sucesso', 'Evento criado com sucesso!');
      }, 100);
      
    } catch (error: any) {
      console.error('Erro ao criar evento:', error);
      Alert.alert('Erro', error.message || 'Não foi possível criar o evento');
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

  // ============================================
  // RENDER
  // ============================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Criar Evento"
        subtitle={grupo?.nome || 'Grupo'}
        leftElement={
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        }
        onLeftPress={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={[
              styles.saveButton,
              { 
                backgroundColor: theme.colors.primary,
                opacity: isLoading ? 0.6 : 1
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
                      backgroundColor: formData.tipo_evento === tipo.value 
                        ? theme.colors.primary 
                        : theme.colors.background,
                      borderColor: formData.tipo_evento === tipo.value 
                        ? theme.colors.primary 
                        : theme.colors.border,
                    }
                  ]}
                  onPress={() => handleInputChange('tipo_evento', tipo.value as any)}
                >
                  <Ionicons 
                    name={tipo.icon as any} 
                    size={18} 
                    color={formData.tipo_evento === tipo.value ? '#FFFFFF' : theme.colors.text} 
                  />
                  <Text 
                    style={[
                      styles.tipoText,
                      { 
                        color: formData.tipo_evento === tipo.value ? '#FFFFFF' : theme.colors.text 
                      }
                    ]}
                  >
                    {tipo.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Datas */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Data e Horário
            </Text>
            
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              onPress={() => setShowDatePicker('inicio')}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <View style={styles.dateInfo}>
                <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
                  Início
                </Text>
                <Text style={[styles.dateValue, { color: theme.colors.text }]}>
                  {formatDateTime(formData.data_inicio)}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              onPress={() => setShowDatePicker('fim')}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <View style={styles.dateInfo}>
                <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
                  Fim
                </Text>
                <Text style={[styles.dateValue, { color: theme.colors.text }]}>
                  {formatDateTime(formData.data_fim)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Local */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Local (Opcional)
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
              placeholder="Ex: Sala 101, Auditório, etc."
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.local}
              onChangeText={(text) => handleInputChange('local', text)}
              maxLength={255}
            />
          </View>

          {/* Link Virtual */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Link Virtual (Opcional)
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
              placeholder="Ex: https://meet.google.com/..."
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.link_virtual}
              onChangeText={(text) => handleInputChange('link_virtual', text)}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Descrição */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Descrição (Opcional)
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
              placeholder="Descreva o evento, objetivos, preparações necessárias..."
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.descricao}
              onChangeText={(text) => handleInputChange('descricao', text)}
              multiline
              numberOfLines={4}
              maxLength={2000}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(showDatePicker === 'inicio' ? formData.data_inicio : formData.data_fim)}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  tiposContainer: {
    marginTop: 8,
  },
  tipoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  tipoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateEventoScreen;
