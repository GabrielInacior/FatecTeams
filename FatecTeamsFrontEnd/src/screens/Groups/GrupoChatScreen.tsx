import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import Header from '../../components/common/Header';
import { useTheme } from '../../hooks/useTheme';
import webSocketService from '../../services/websocketService';
import { AppDispatch, RootState } from '../../store';
import { createMensagem, fetchMensagens, markAsRead, setCurrentUserId } from '../../store/chatSlice';

// ============================================
// INTERFACES
// ============================================

interface Mensagem {
  id: string;
  conteudo: string;
  tipo_mensagem: 'texto' | 'arquivo' | 'imagem';
  autor_id?: string;        // Para compatibilidade com frontend
  remetente_id?: string;    // Campo real do backend
  grupo_id: string;
  data_criacao?: string;    // Para compatibilidade com frontend
  data_envio?: string;      // Campo real do backend
  data_atualizacao?: string;
  data_edicao?: string;     // Campo real do backend
  arquivo_id?: string;
  mensagem_pai_id?: string;
  mencionados?: string[];
  editado: boolean;
  autor?: {
    id: string;
    nome: string;
    email: string;
    foto_perfil?: string;
  };
  // Campos adicionais do backend
  remetente_nome?: string;
  remetente_foto?: string;
}

interface TypingUser {
  usuarioId: string;
  nomeUsuario: string;
  timestamp: number;
}

// ============================================
// FUNÇÕES HELPER
// ============================================

// Função para obter ID do autor da mensagem
const getAuthorId = (mensagem: Mensagem): string => {
  return mensagem.autor_id || mensagem.remetente_id || '';
};

// Função para obter data da mensagem
const getMessageDate = (mensagem: Mensagem): string => {
  return mensagem.data_criacao || mensagem.data_envio || '';
};

// Função para obter nome do autor
const getAuthorName = (mensagem: Mensagem): string => {
  return mensagem.autor?.nome || mensagem.remetente_nome || 'Usuário';
};

// Função para obter foto do autor
const getAuthorPhoto = (mensagem: Mensagem): string | undefined => {
  return mensagem.autor?.foto_perfil || mensagem.remetente_foto;
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const MensagemItem: React.FC<{
  mensagem: Mensagem;
  isOwn: boolean;
  theme: any;
  onLongPress: (mensagem: Mensagem) => void;
}> = ({ mensagem, isOwn, theme, onLongPress }) => {
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderAvatar = () => {
    const authorPhoto = getAuthorPhoto(mensagem);
    if (authorPhoto) {
      return (
        <Image
          source={{ uri: authorPhoto }}
          style={styles.avatar}
        />
      );
    }
    
    return (
      <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.avatarText}>
          {getAuthorName(mensagem).charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  };

  return (
    <View style={[
      styles.mensagemContainer,
      isOwn ? styles.mensagemOwnContainer : styles.mensagemOtherContainer
    ]}>
      {!isOwn && (
        <View style={styles.avatarContainer}>
          {renderAvatar()}
        </View>
      )}
      
      <View style={styles.mensagemContent}>
        {!isOwn && (
          <Text style={[styles.autorNome, { color: theme.colors.primary }]}>
            {getAuthorName(mensagem)}
          </Text>
        )}
        
        <TouchableOpacity
          style={[
            styles.mensagemBubble,
            {
              backgroundColor: isOwn ? theme.colors.primary : theme.colors.card,
              alignSelf: isOwn ? 'flex-end' : 'flex-start',
            }
          ]}
          onLongPress={() => onLongPress(mensagem)}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.mensagemTexto,
            { color: isOwn ? '#FFFFFF' : theme.colors.text }
          ]}>
            {mensagem.conteudo}
          </Text>
          
          <View style={styles.mensagemFooter}>
            <Text style={[
              styles.mensagemTime,
              { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }
            ]}>
              {formatTime(getMessageDate(mensagem))}
            </Text>
            {mensagem.editado && (
              <Text style={[
                styles.editadoLabel,
                { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }
              ]}>
                • editado
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TypingIndicator: React.FC<{
  typingUsers: TypingUser[];
  theme: any;
}> = ({ typingUsers, theme }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (typingUsers.length > 0) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [typingUsers.length, opacity]);

  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].nomeUsuario} está digitando...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].nomeUsuario} e ${typingUsers[1].nomeUsuario} estão digitando...`;
    } else {
      return `${typingUsers.length} pessoas estão digitando...`;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.typingContainer,
        { backgroundColor: theme.colors.card, opacity }
      ]}
    >
      <View style={styles.typingDots}>
        <View style={[styles.typingDot, { backgroundColor: theme.colors.primary }]} />
        <View style={[styles.typingDot, { backgroundColor: theme.colors.primary }]} />
        <View style={[styles.typingDot, { backgroundColor: theme.colors.primary }]} />
      </View>
      <Text style={[styles.typingText, { color: theme.colors.textSecondary }]}>
        {getTypingText()}
      </Text>
    </Animated.View>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const GrupoChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();

  const { grupoId, grupo } = route.params;
  
  const { mensagens, isLoading } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mensagens do grupo atual
  const grupoMensagens = mensagens[grupoId] || [];

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    initializeChat();
    return cleanup;
  }, [grupoId]);

  useEffect(() => {
    // Auto-scroll para o final quando novas mensagens chegam
    if (grupoMensagens.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [grupoMensagens.length]);

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================

  const initializeChat = async () => {
    try {
      // Definir usuário atual no store
      if (user?.id) {
        dispatch(setCurrentUserId(user.id));
      }

      // Carregar mensagens iniciais
      await dispatch(fetchMensagens({ 
        grupoId, 
        queryParams: { limit: 50, offset: 0 } 
      })).unwrap();

      // Conectar WebSocket se necessário
      if (!webSocketService.isConnected()) {
        const token = 'dummy-token'; // TODO: Usar token real do usuário
        await webSocketService.connect(token, {
          onConnect: () => {
            setIsConnected(true);
            webSocketService.identifyUser(user?.id || '');
            webSocketService.joinGroup(grupoId);
          },
          onDisconnect: () => setIsConnected(false),
          onError: (error) => {
            console.error('Erro WebSocket:', error);
            setIsConnected(false);
          },
          onUserTyping: handleUserTyping,
        });
      } else {
        webSocketService.joinGroup(grupoId);
        setIsConnected(true);
      }

      // Marcar mensagens como lidas
      dispatch(markAsRead(grupoId));

    } catch (error) {
      console.error('Erro ao inicializar chat:', error);
      Alert.alert('Erro', 'Não foi possível carregar o chat');
    }
  };

  const cleanup = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    webSocketService.leaveGroup(grupoId);
    webSocketService.stopTyping(grupoId, user?.nome || '');
  };

  const handleUserTyping = useCallback((data: any) => {
    if (data.usuarioId === user?.id) return; // Ignorar própria digitação

    setTypingUsers(prev => {
      const filtered = prev.filter(u => u.usuarioId !== data.usuarioId);
      
      if (data.typing) {
        return [...filtered, {
          usuarioId: data.usuarioId,
          nomeUsuario: data.nomeUsuario,
          timestamp: Date.now()
        }];
      } else {
        return filtered;
      }
    });

    // Remover indicador após 5 segundos
    setTimeout(() => {
      setTypingUsers(prev => 
        prev.filter(u => u.usuarioId !== data.usuarioId || Date.now() - u.timestamp > 5000)
      );
    }, 5000);
  }, [user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchMensagens({ 
        grupoId, 
        queryParams: { limit: 50, offset: 0 } 
      })).unwrap();
    } catch (error) {
      console.error('Erro ao atualizar mensagens:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      await dispatch(createMensagem({
        grupoId,
        mensagemData: {
          conteudo: messageText,
          tipo_mensagem: 'texto'
        }
      })).unwrap();

      // Parar indicador de digitação
      webSocketService.stopTyping(grupoId, user?.nome || '');
      
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      Alert.alert('Erro', error.message || 'Não foi possível enviar a mensagem');
      setInputText(messageText); // Restaurar texto em caso de erro
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    // Indicador de digitação
    if (text.trim() && isConnected) {
      webSocketService.startTyping(grupoId, user?.nome || '');
    } else {
      webSocketService.stopTyping(grupoId, user?.nome || '');
    }

    // Auto-stop depois de 3 segundos
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      webSocketService.stopTyping(grupoId, user?.nome || '');
    }, 3000);
  };

  const handleMensagemLongPress = (mensagem: Mensagem) => {
    const isOwn = getAuthorId(mensagem) === user?.id;
    
    const options: any[] = [
      { text: 'Cancelar', style: 'cancel' }
    ];

    if (isOwn) {
      options.unshift(
        { text: 'Editar', onPress: () => handleEditMessage(mensagem) },
        { text: 'Deletar', style: 'destructive', onPress: () => handleDeleteMessage(mensagem) }
      );
    }

    options.unshift(
      { text: 'Responder', onPress: () => handleReplyMessage(mensagem) }
    );

    Alert.alert('Opções da Mensagem', '', options);
  };

  const handleEditMessage = (mensagem: Mensagem) => {
    // TODO: Implementar edição de mensagem
    Alert.alert('Em desenvolvimento', 'Funcionalidade de edição será implementada em breve');
  };

  const handleDeleteMessage = (mensagem: Mensagem) => {
    Alert.alert(
      'Deletar Mensagem',
      'Tem certeza que deseja deletar esta mensagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Deletar', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implementar deleção
            Alert.alert('Em desenvolvimento', 'Funcionalidade de deleção será implementada em breve');
          }
        }
      ]
    );
  };

  const handleReplyMessage = (mensagem: Mensagem) => {
    // TODO: Implementar resposta
    Alert.alert('Em desenvolvimento', 'Funcionalidade de resposta será implementada em breve');
  };

  const renderMensagem = ({ item }: { item: Mensagem }) => {
    const isOwn = getAuthorId(item) === user?.id;
    
    return (
      <MensagemItem
        mensagem={item}
        isOwn={isOwn}
        theme={theme}
        onLongPress={handleMensagemLongPress}
      />
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title={grupo?.nome || 'Chat'}
        subtitle={isConnected ? 'Online' : 'Desconectado'}
        leftElement={
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        }
        onLeftPress={() => navigation.goBack()}
        rightElement={
          <View style={styles.headerActions}>
            <View style={[
              styles.connectionIndicator,
              { backgroundColor: isConnected ? theme.colors.success : theme.colors.error }
            ]} />
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: theme.colors.card }]}
              onPress={() => {
                Alert.alert('Em desenvolvimento', 'Opções do chat serão implementadas em breve');
              }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        }
      />

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={grupoMensagens}
          renderItem={renderMensagem}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          inverted={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="chatbubbles-outline" 
                size={64} 
                color={theme.colors.textSecondary} 
              />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Nenhuma mensagem ainda
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                Seja o primeiro a enviar uma mensagem!
              </Text>
            </View>
          }
        />

        <TypingIndicator typingUsers={typingUsers} theme={theme} />

        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={[
                styles.textInput,
                { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }
              ]}
              placeholder="Digite sua mensagem..."
              placeholderTextColor={theme.colors.textSecondary}
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={4000}
              blurOnSubmit={false}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                { 
                  backgroundColor: inputText.trim() ? theme.colors.primary : theme.colors.border,
                  opacity: inputText.trim() ? 1 : 0.5
                }
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || !isConnected}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() ? '#FFFFFF' : theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  mensagemContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  mensagemOwnContainer: {
    justifyContent: 'flex-end',
  },
  mensagemOtherContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mensagemContent: {
    flex: 1,
    maxWidth: '80%',
  },
  autorNome: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 12,
  },
  mensagemBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mensagemTexto: {
    fontSize: 16,
    lineHeight: 22,
  },
  mensagemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  mensagemTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  editadoLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default GrupoChatScreen;
