import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import Header from '../../components/common/Header';
import { useTheme } from '../../hooks/useTheme';
import eventosBackendService, { EventoBackend } from '../../services/eventosBackendService';
import { RootState } from '../../store';

// ============================================
// INTERFACES
// ============================================

interface RouteParams {
  grupoId: string;
  grupo: any;
  shouldRefresh?: boolean;
}

interface FiltrosEventos {
  tipo?: string;
  status?: string;
}

type ViewMode = 'calendar' | 'list';

// ============================================
// COMPONENTES AUXILIARES
// ============================================

// Calendário customizado estilo Teams
const CalendarView: React.FC<{
  theme: any;
  eventos: EventoBackend[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventPress: (evento: EventoBackend) => void;
}> = ({ theme, eventos, selectedDate, onDateSelect, onEventPress }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Adicionar dias vazios do início
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Adicionar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventosForDate = (date: Date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return eventos.filter(evento => {
      const eventoDate = new Date(evento.data_inicio).toISOString().split('T')[0];
      return eventoDate === dateStr;
    });
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const isSelectedDate = (date: Date) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  return (
    <View style={[styles.calendarContainer, { backgroundColor: theme.colors.card }]}>
      {/* Header do Calendário */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          style={styles.calendarNavButton}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.calendarTitle, { color: theme.colors.text }]}>
          {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </Text>
        
        <TouchableOpacity
          onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          style={styles.calendarNavButton}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Dias da Semana */}
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day) => (
          <Text key={day} style={[styles.weekDayText, { color: theme.colors.textSecondary }]}>
            {day}
          </Text>
        ))}
      </View>

      {/* Grade de Dias */}
      <View style={styles.daysGrid}>
        {days.map((date, index) => {
          const dayEvents = date ? getEventosForDate(date) : [];
          const hasEvents = dayEvents.length > 0;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                date && isSelectedDate(date) && { backgroundColor: theme.colors.primary },
                date && isToday(date) && { borderColor: theme.colors.primary, borderWidth: 2 },
              ]}
              onPress={() => date && onDateSelect(date)}
              disabled={!date}
            >
              {date && (
                <>
                  <Text style={[
                    styles.dayText,
                    { color: isSelectedDate(date) ? '#FFFFFF' : theme.colors.text },
                    isToday(date) && !isSelectedDate(date) && { color: theme.colors.primary, fontWeight: 'bold' }
                  ]}>
                    {date.getDate()}
                  </Text>
                  {hasEvents && (
                    <View style={styles.eventIndicatorsContainer}>
                      {dayEvents.slice(0, 3).map((evento, eventIndex) => (
                        <TouchableOpacity
                          key={eventIndex}
                          style={[
                            styles.eventIndicator,
                            { backgroundColor: theme.colors.primary }
                          ]}
                          onPress={() => onEventPress(evento)}
                        >
                          <Text style={styles.eventIndicatorText} numberOfLines={1}>
                            {evento.titulo}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {dayEvents.length > 3 && (
                        <Text style={[styles.moreEventsText, { color: theme.colors.textSecondary }]}>
                          +{dayEvents.length - 3} mais
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Modal de Detalhes do Evento
const EventoDetailsModal: React.FC<{
  visible: boolean;
  evento: EventoBackend | null;
  theme: any;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (evento: EventoBackend) => void;
  onDelete: (evento: EventoBackend) => void;
}> = ({ visible, evento, theme, canEdit, onClose, onEdit, onDelete }) => {
  if (!evento) return null;  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = () => {
    switch (evento.status) {
      case 'agendado': return theme.colors.primary;
      case 'em_andamento': return theme.colors.warning;
      case 'concluido': return theme.colors.success;
      case 'cancelado': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getTipoIcon = () => {
    switch (evento.tipo_evento) {
      case 'reuniao': return 'people';
      case 'estudo': return 'library';
      case 'prova': return 'document-text';
      case 'apresentacao': return 'easel';
      case 'aula': return 'school';
      case 'deadline': return 'alarm';
      default: return 'calendar';
    }
  };

  const getTipoText = () => {
    switch (evento.tipo_evento) {
      case 'reuniao': return 'Reunião';
      case 'estudo': return 'Estudo';
      case 'prova': return 'Prova';
      case 'apresentacao': return 'Apresentação';
      case 'aula': return 'Aula';
      case 'deadline': return 'Prazo';
      default: return 'Evento';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Detalhes do Evento
          </Text>
          
          {canEdit && (
            <TouchableOpacity 
              onPress={() => {
                onClose();
                onEdit(evento);
              }}
              style={styles.modalEditButton}
            >
              <Ionicons name="create" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Cabeçalho do Evento */}
          <View style={[styles.modalEventHeader, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalEventIcon}>
              <View style={[styles.eventTypeIconLarge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name={getTipoIcon()} size={32} color={theme.colors.primary} />
              </View>
            </View>
            
            <View style={styles.modalEventInfo}>
              <Text style={[styles.modalEventTitle, { color: theme.colors.text }]}>
                {evento.titulo}
              </Text>
              
              <View style={styles.modalEventMeta}>
                <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor() + '20' }]}>
                  <Text style={[styles.modalStatusText, { color: getStatusColor() }]}>
                    {evento.status?.toUpperCase()}
                  </Text>
                </View>
                
                <View style={[styles.modalTipoBadge, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.modalTipoText, { color: theme.colors.textSecondary }]}>
                    {getTipoText()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Detalhes */}
          <View style={[styles.modalSection, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>
              Data e Hora
            </Text>
            
            <View style={styles.modalDetailRow}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.modalDetailText, { color: theme.colors.text }]}>
                {formatDate(evento.data_inicio)}
              </Text>
            </View>
            
            <View style={styles.modalDetailRow}>
              <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.modalDetailText, { color: theme.colors.text }]}>
                {formatTime(evento.data_inicio)} - {formatTime(evento.data_fim)}
              </Text>
            </View>
          </View>

          {evento.descricao && (
            <View style={[styles.modalSection, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>
                Descrição
              </Text>
              <Text style={[styles.modalDescriptionText, { color: theme.colors.textSecondary }]}>
                {evento.descricao}
              </Text>
            </View>
          )}

          {evento.local && (
            <View style={[styles.modalSection, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>
                Local
              </Text>
              <View style={styles.modalDetailRow}>
                <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.modalDetailText, { color: theme.colors.text }]}>
                  {evento.local}
                </Text>
              </View>
            </View>
          )}

          {evento.link_virtual && (
            <View style={[styles.modalSection, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>
                Link Virtual
              </Text>
              <View style={styles.modalDetailRow}>
                <Ionicons name="videocam-outline" size={20} color={theme.colors.info} />
                <Text style={[styles.modalDetailText, { color: theme.colors.info }]}>
                  Evento Virtual Disponível
                </Text>
              </View>
            </View>
          )}

          {canEdit && (
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: theme.colors.primary, marginBottom: 12 }]}
                onPress={() => {
                  onClose();
                  onEdit(evento);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                <Text style={styles.modalActionButtonText}>Editar Evento</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: theme.colors.error }]}
                onPress={() => {
                  onClose();
                  onDelete(evento);
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                <Text style={styles.modalActionButtonText}>Excluir Evento</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const EventoCard: React.FC<{
  evento: EventoBackend;
  theme: any;
  onPress: (evento: EventoBackend) => void;
  onEdit: (evento: EventoBackend) => void;
  onDelete: (evento: EventoBackend) => void;
  canEdit: boolean;
}> = ({ evento, theme, onPress, onEdit, onDelete, canEdit }) => {
  // Validação para garantir que os dados essenciais estão presentes
  if (!evento || !evento.id || !evento.titulo) {
    console.warn('❌ EventoCard: Dados inválidos do evento:', evento);
    return null;
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não definida';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Data inválida';
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Hora não definida';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Hora inválida';
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Hora inválida';
    }
  };

  const getStatusColor = () => {
    switch (evento.status) {
      case 'agendado':
        return theme.colors.primary;
      case 'em_andamento':
        return theme.colors.warning;
      case 'concluido':
        return theme.colors.success;
      case 'cancelado':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = () => {
    switch (evento.status) {
      case 'agendado':
        return 'Agendado';
      case 'em_andamento':
        return 'Em Andamento';
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  };

  const getTipoIcon = () => {
    switch (evento.tipo_evento) {
      case 'reuniao':
        return 'people';
      case 'estudo':
        return 'library';
      case 'prova':
        return 'document-text';
      case 'apresentacao':
        return 'easel';
      case 'aula':
        return 'school';
      case 'deadline':
        return 'alarm';
      default:
        return 'calendar';
    }
  };

  const getTipoText = () => {
    switch (evento.tipo_evento) {
      case 'reuniao':
        return 'Reunião';
      case 'estudo':
        return 'Estudo';
      case 'prova':
        return 'Prova';
      case 'apresentacao':
        return 'Apresentação';
      case 'aula':
        return 'Aula';
      case 'deadline':
        return 'Prazo';
      case 'outro':
        return 'Outro';
      default:
        return 'Evento';
    }
  };

  const isEventExpired = () => {
    return new Date(evento.data_fim) < new Date();
  };

  const handleOptionsPress = () => {
    const options: any[] = [
      { text: 'Cancelar', style: 'cancel' }
    ];

    if (canEdit) {
      options.unshift(
        { text: 'Editar', onPress: () => onEdit(evento) },
        { text: 'Excluir', style: 'destructive', onPress: () => onDelete(evento) }
      );
    }

    Alert.alert('Opções do Evento', '', options);
  };

  return (
    <TouchableOpacity
      style={[
        styles.eventoCard,
        { 
          backgroundColor: theme.colors.card,
          opacity: isEventExpired() && evento.status !== 'concluido' ? 0.7 : 1
        }
      ]}
      onPress={() => onPress(evento)}
      activeOpacity={0.8}
    >
      <View style={styles.eventoHeader}>
        <View style={styles.eventoInfo}>
          <View style={styles.eventoTitleRow}>
            <View style={[styles.eventoTypeIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name={getTipoIcon()} size={18} color={theme.colors.primary} />
            </View>
            <Text style={[styles.eventoTitulo, { color: theme.colors.text }]} numberOfLines={1}>
              {evento.titulo || 'Evento sem título'}
            </Text>
          </View>
          
          <View style={styles.eventoMeta}>
            <View style={styles.eventoDateInfo}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.eventoDate, { color: theme.colors.textSecondary }]}>
                {formatDate(evento.data_inicio)}
              </Text>
            </View>
            
            <View style={styles.eventoTimeInfo}>
              <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.eventoTime, { color: theme.colors.textSecondary }]}>
                {formatTime(evento.data_inicio)} - {formatTime(evento.data_fim)}
              </Text>
            </View>
          </View>

          {evento.local && evento.local.trim() && (
            <View style={styles.eventoLocation}>
              <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.eventoLocationText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {evento.local.trim()}
              </Text>
            </View>
          )}

          {evento.link_virtual && evento.link_virtual.trim() && (
            <View style={styles.eventoVirtualLink}>
              <Ionicons name="videocam-outline" size={14} color={theme.colors.info} />
              <Text style={[styles.eventoVirtualText, { color: theme.colors.info }]}>
                Evento Virtual
              </Text>
            </View>
          )}
        </View>

        <View style={styles.eventoActions}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          
          <View style={[styles.tipoBadge, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.tipoText, { color: theme.colors.textSecondary }]}>
              {getTipoText()}
            </Text>
          </View>

          {canEdit && (
            <TouchableOpacity
              style={[styles.optionsButton, { backgroundColor: theme.colors.background }]}
              onPress={handleOptionsPress}
            >
              <Ionicons name="ellipsis-vertical" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {evento.descricao && evento.descricao.trim() && (
        <Text style={[styles.eventoDescricao, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {evento.descricao.trim()}
        </Text>
      )}

      {evento.participantes && evento.participantes.length > 0 && (
        <View style={styles.participantesInfo}>
          <Ionicons name="people-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.participantesText, { color: theme.colors.textSecondary }]}>
            {evento.participantes.length} participante{evento.participantes.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const FilterBar: React.FC<{
  theme: any;
  filtros: FiltrosEventos;
  onFilterChange: (filtros: FiltrosEventos) => void;
}> = ({ theme, filtros, onFilterChange }) => {
  const tiposEvento = [
    { key: 'todos', label: 'Todos', value: undefined },
    { key: 'reuniao', label: 'Reunião', value: 'reuniao' },
    { key: 'estudo', label: 'Estudo', value: 'estudo' },
    { key: 'prova', label: 'Prova', value: 'prova' },
    { key: 'apresentacao', label: 'Apresentação', value: 'apresentacao' },
    { key: 'aula', label: 'Aula', value: 'aula' },
    { key: 'deadline', label: 'Prazo', value: 'deadline' },
    { key: 'outro', label: 'Outro', value: 'outro' },
  ];

  const statusEvento = [
    { key: 'todos', label: 'Todos', value: undefined },
    { key: 'agendado', label: 'Agendado', value: 'agendado' },
    { key: 'em_andamento', label: 'Em Andamento', value: 'em_andamento' },
    { key: 'concluido', label: 'Concluído', value: 'concluido' },
    { key: 'cancelado', label: 'Cancelado', value: 'cancelado' },
  ];

  return (
    <View style={[styles.filterContainer, { backgroundColor: theme.colors.card }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Tipo:</Text>
        {tiposEvento.map((tipo) => (
          <TouchableOpacity
            key={tipo.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: filtros.tipo === tipo.value ? theme.colors.primary : theme.colors.background,
                borderColor: theme.colors.border,
              }
            ]}
            onPress={() => onFilterChange({ ...filtros, tipo: tipo.value })}
          >
            <Text style={[
              styles.filterChipText,
              { color: filtros.tipo === tipo.value ? '#FFFFFF' : theme.colors.text }
            ]}>
              {tipo.label}
            </Text>
          </TouchableOpacity>
        ))}
        
        <View style={styles.filterDivider} />
        
        <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Status:</Text>
        {statusEvento.map((status) => (
          <TouchableOpacity
            key={status.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: filtros.status === status.value ? theme.colors.primary : theme.colors.background,
                borderColor: theme.colors.border,
              }
            ]}
            onPress={() => onFilterChange({ ...filtros, status: status.value })}
          >
            <Text style={[
              styles.filterChipText,
              { color: filtros.status === status.value ? '#FFFFFF' : theme.colors.text }
            ]}>
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Modal de Confirmação para Deletar Evento
const DeleteEventoModal: React.FC<{
  visible: boolean;
  evento: EventoBackend | null;
  isDeleting: boolean;
  theme: any;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ visible, evento, isDeleting, theme, onClose, onConfirm }) => {
  if (!evento) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.deleteModalContent, { backgroundColor: theme.colors.card }]}>
          <View style={styles.deleteModalHeader}>
            <View style={[styles.deleteWarningIcon, { backgroundColor: theme.colors.error + '20' }]}>
              <Ionicons name="warning" size={32} color={theme.colors.error} />
            </View>
            <Text style={[styles.deleteModalTitle, { color: theme.colors.text }]}>
              Excluir Evento
            </Text>
            <Text style={[styles.deleteModalMessage, { color: theme.colors.textSecondary }]}>
              Tem certeza que deseja excluir o evento "{evento.titulo}"?
            </Text>
            <Text style={[styles.deleteModalWarning, { color: theme.colors.error }]}>
              Esta ação não pode ser desfeita.
            </Text>
          </View>

          <View style={styles.deleteModalActions}>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.cancelButton, { backgroundColor: theme.colors.background }]}
              onPress={onClose}
              disabled={isDeleting}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteModalButton, 
                styles.confirmDeleteButton, 
                { 
                  backgroundColor: theme.colors.error,
                  opacity: isDeleting ? 0.6 : 1
                }
              ]}
              onPress={onConfirm}
              disabled={isDeleting}
            >
              <Text style={styles.confirmDeleteButtonText}>
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const GrupoEventosScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();

  const { grupoId, grupo, shouldRefresh } = route.params as RouteParams;
  
  const { user } = useSelector((state: RootState) => state.auth);

  const [eventos, setEventos] = useState<EventoBackend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosEventos>({});
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvento, setSelectedEvento] = useState<EventoBackend | null>(null);
  const [showEventoModal, setShowEventoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState<EventoBackend | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Eventos filtrados
  const eventosFiltrados = useMemo(() => {
    let result = [...eventos];

    if (filtros.tipo) {
      result = result.filter(evento => evento.tipo_evento === filtros.tipo);
    }

    if (filtros.status) {
      result = result.filter(evento => evento.status === filtros.status);
    }

    // Ordenar por data
    result.sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());

    return result;
  }, [eventos, filtros]);

  // Cálculo de estatísticas dos eventos
  const eventStats = useMemo(() => {
    const total = eventos.length;
    const agendados = eventos.filter(e => e.status === 'agendado').length;
    const concluidos = eventos.filter(e => e.status === 'concluido').length;
    const hoje = new Date().toISOString().split('T')[0];
    const eventosHoje = eventos.filter(e => {
      const eventoDate = new Date(e.data_inicio).toISOString().split('T')[0];
      return eventoDate === hoje;
    }).length;
    
    return { total, agendados, concluidos, eventosHoje };
  }, [eventos]);

  // Texto do subtitle baseado no viewMode e filtros
  const getSubtitle = () => {
    const { total, agendados, concluidos, eventosHoje } = eventStats;
    const filteredCount = eventosFiltrados.length;
    
    // Garantir que todos os valores são números válidos
    const safeTotal = total || 0;
    const safeAgendados = agendados || 0;
    const safeConcluidos = concluidos || 0;
    const safeEventosHoje = eventosHoje || 0;
    const safeFilteredCount = filteredCount || 0;
    
    if (filtros.tipo || filtros.status) {
      return `${safeFilteredCount} de ${safeTotal} eventos`;
    }
    
    if (viewMode === 'calendar') {
      return `${safeTotal} eventos • ${safeEventosHoje} hoje`;
    }
    
    return `${safeTotal} eventos • ${safeAgendados} agendados • ${safeConcluidos} concluídos`;
  };

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    loadEventos();
  }, [grupoId]);

  // Recarregar sempre que a tela entrar em foco
  useFocusEffect(
    useCallback(() => {
      loadEventos();
    }, [grupoId])
  );

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================

  const loadEventos = async () => {
    try {
      setIsLoading(true);
      const response = await eventosBackendService.listarEventosGrupo(grupoId);
      setEventos(response.eventos || []);
    } catch (error: any) {
      console.error('Erro ao carregar eventos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os eventos');
      setEventos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadEventos();
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = (newFiltros: FiltrosEventos) => {
    setFiltros(newFiltros);
  };

  const handleCreateEvento = () => {
    navigation.navigate('CreateEvento', { grupoId, grupo });
  };

  const handleEventoPress = (evento: EventoBackend) => {
    setSelectedEvento(evento);
    setShowEventoModal(true);
  };

  const handleEditEvento = (evento: EventoBackend) => {
    navigation.navigate('EditEvento', { eventoId: evento.id, evento, grupoId });
  };

  const handleDeleteEvento = (evento: EventoBackend) => {
    console.log('🗑️ Tentando deletar evento:', evento.id, evento.titulo);
    setEventoToDelete(evento);
    setShowDeleteModal(true);
  };

  const confirmDeleteEvento = async () => {
    if (!eventoToDelete) return;
    
    try {
      console.log('🔄 Iniciando exclusão do evento:', eventoToDelete.id);
      setIsDeleting(true);
      
      const result = await eventosBackendService.deletarEvento(eventoToDelete.id);
      console.log('✅ Evento deletado com sucesso:', result);
      
      // Fechar modal de evento se estiver aberto
      if (showEventoModal && selectedEvento?.id === eventoToDelete.id) {
        setShowEventoModal(false);
        setSelectedEvento(null);
      }
      
      // Fechar modal de confirmação
      setShowDeleteModal(false);
      setEventoToDelete(null);
      
      // Recarregar lista de eventos
      await loadEventos();
      
      Alert.alert('Sucesso', 'Evento excluído com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao deletar evento:', error);
      console.error('❌ Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.erro || 
                         error.response?.data?.mensagem || 
                         error.message || 
                         'Não foi possível excluir o evento';
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteEvento = () => {
    setShowDeleteModal(false);
    setEventoToDelete(null);
    setIsDeleting(false);
  };

  const canEditEvento = (evento: EventoBackend) => {
    return evento.criado_por === user?.id;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primary + '20' }]}>
        <Ionicons name="calendar-outline" size={48} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Nenhum evento encontrado
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
        {filtros.tipo || filtros.status 
          ? 'Tente ajustar os filtros para encontrar eventos'
          : 'Crie o primeiro evento do grupo para começar a organizar atividades'}
      </Text>
      {(!filtros.tipo && !filtros.status) && (
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleCreateEvento}
        >
          <Text style={styles.emptyButtonText}>Criar Primeiro Evento</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEvento = ({ item }: { item: EventoBackend }) => (
    <EventoCard
      evento={item}
      theme={theme}
      onPress={handleEventoPress}
      onEdit={handleEditEvento}
      onDelete={handleDeleteEvento}
      canEdit={canEditEvento(item)}
    />
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Eventos"
        subtitle={getSubtitle()}
        leftElement={
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        }
        onLeftPress={() => navigation.goBack()}
        rightElement={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.viewToggleButton, { backgroundColor: theme.colors.card }]}
              onPress={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            >
              <Ionicons 
                name={viewMode === 'calendar' ? 'list' : 'calendar'} 
                size={20} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleCreateEvento}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      <FilterBar
        theme={theme}
        filtros={filtros}
        onFilterChange={handleFilterChange}
      />

      {viewMode === 'calendar' ? (
        <CalendarView
          theme={theme}
          eventos={eventosFiltrados}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onEventPress={handleEventoPress}
        />
      ) : (
        <FlatList
          data={eventosFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={renderEvento}
          style={styles.eventsList}
          contentContainerStyle={styles.eventsContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
          showsVerticalScrollIndicator={false}
        />
      )}

      <EventoDetailsModal
        visible={showEventoModal}
        evento={selectedEvento}
        theme={theme}
        canEdit={selectedEvento ? canEditEvento(selectedEvento) : false}
        onClose={() => {
          setShowEventoModal(false);
          setSelectedEvento(null);
        }}
        onEdit={handleEditEvento}
        onDelete={handleDeleteEvento}
      />

      <DeleteEventoModal
        visible={showDeleteModal}
        evento={eventoToDelete}
        isDeleting={isDeleting}
        theme={theme}
        onClose={cancelDeleteEvento}
        onConfirm={confirmDeleteEvento}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterContainer: {
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  eventsList: {
    flex: 1,
  },
  eventsContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  eventoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  eventoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventoInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventoTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventoTitulo: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  eventoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 4,
  },
  eventoDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventoDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  eventoTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventoTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  eventoLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  eventoLocationText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  eventoVirtualLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  eventoVirtualText: {
    fontSize: 12,
    fontWeight: '500',
  },
  eventoActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tipoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tipoText: {
    fontSize: 10,
    fontWeight: '500',
  },
  optionsButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventoDescricao: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  participantesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Header Actions
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // Calendário
  calendarContainer: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100/7}%`,
    minHeight: 60,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 8,
    margin: 1,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  eventIndicatorsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  eventIndicator: {
    width: '100%',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 2,
    marginBottom: 1,
  },
  eventIndicatorText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  moreEventsText: {
    fontSize: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalEditButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalEventHeader: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  modalEventIcon: {
    marginRight: 16,
  },
  eventTypeIconLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEventInfo: {
    flex: 1,
  },
  modalEventTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalEventMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  modalStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modalTipoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalTipoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalDetailText: {
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
  },
  modalDescriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  modalActions: {
    marginTop: 24,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos do DeleteEventoModal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    minWidth: 320,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteWarningIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  deleteModalWarning: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    backgroundColor: '#DC2626',
  },
  confirmDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GrupoEventosScreen;
