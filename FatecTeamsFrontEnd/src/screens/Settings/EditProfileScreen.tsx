import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { RootState, AppDispatch } from '../../store';
import { updateUserProfileAsync, uploadProfilePhotoAsync } from '../../store/authSlice';
import { useTheme } from '../../hooks/useTheme';
import Header from '../../components/common/Header';

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  
  const [nome, setNome] = useState(user?.nome || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setTelefone(user.telefone || '');
    }
  }, [user]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleSelectImage = async () => {
    try {
      // Solicitar permissão
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permissão Necessária', 'É necessário permitir o acesso às fotos para alterar a imagem de perfil.');
        return;
      }

      // Abrir seletor de imagem
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Criar objeto File para upload
        const file = {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: `profile_${Date.now()}.jpg`,
        } as any;

        try {
          setIsUpdating(true);
          await dispatch(uploadProfilePhotoAsync(file)).unwrap();
          Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
        } catch (error: any) {
          Alert.alert('Erro', error.message || 'Erro ao atualizar foto de perfil');
        } finally {
          setIsUpdating(false);
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Erro ao selecionar imagem');
    }
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório');
      return;
    }

    try {
      setIsUpdating(true);
      await dispatch(updateUserProfileAsync({
        nome: nome.trim(),
        telefone: telefone.trim() || undefined,
      })).unwrap();
      
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar perfil');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderProfileImage = () => {
    const imageUri = user?.foto_perfil;
    
    return (
      <TouchableOpacity
        style={[styles.imageContainer, { backgroundColor: theme.colors.card }]}
        onPress={handleSelectImage}
        disabled={isUpdating}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.profileImage} />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.placeholderText}>
              {nome.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        
        <View style={[styles.editImageOverlay, { backgroundColor: theme.colors.primary }]}>
          {isUpdating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Editar Perfil"
        leftElement={
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        }
        onLeftPress={handleGoBack}
        rightElement={
          <TouchableOpacity onPress={handleSave} disabled={isUpdating || isLoading}>
            {isUpdating || isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={[styles.saveText, { color: theme.colors.primary }]}>
                Salvar
              </Text>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Image */}
        <View style={styles.imageSection}>
          {renderProfileImage()}
          <Text style={[styles.imageHint, { color: theme.colors.textSecondary }]}>
            Toque na imagem para alterá-la
          </Text>
        </View>

        {/* Form */}
        <View style={[styles.formContainer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Nome completo *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                }
              ]}
              value={nome}
              onChangeText={setNome}
              placeholder="Digite seu nome completo"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="words"
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              E-mail
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.inputDisabled,
                {
                  backgroundColor: theme.colors.border,
                  color: theme.colors.textSecondary,
                  borderColor: theme.colors.border,
                }
              ]}
              value={user?.email || ''}
              editable={false}
              placeholder="E-mail não pode ser alterado"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Telefone
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                }
              ]}
              value={telefone}
              onChangeText={setTelefone}
              placeholder="(00) 00000-0000"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
        </View>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            * Campos obrigatórios
          </Text>
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
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 60,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
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
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageHint: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  helpSection: {
    paddingHorizontal: 4,
    paddingBottom: 32,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default EditProfileScreen;
