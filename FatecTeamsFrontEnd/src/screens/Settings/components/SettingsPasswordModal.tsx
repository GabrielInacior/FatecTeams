import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { changePasswordAsync, clearError } from '../../../store/authSlice';
import { useTheme } from '../../../hooks/useTheme';
import AuthInputField from '../../Auth/components/AuthInputField';
import AuthButton from '../../Auth/components/AuthButton';

interface SettingsPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

interface PasswordForm {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

const SettingsPasswordModal: React.FC<SettingsPasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [form, setForm] = useState<PasswordForm>({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });

  const [errors, setErrors] = useState<Partial<PasswordForm>>({});

  useEffect(() => {
    if (error) {
      Alert.alert('Erro', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (visible) {
      // Reset form quando modal abrir
      setForm({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: '',
      });
      setErrors({});
    }
  }, [visible]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PasswordForm> = {};

    if (!form.senhaAtual.trim()) {
      newErrors.senhaAtual = 'Senha atual é obrigatória';
    }

    if (!form.novaSenha.trim()) {
      newErrors.novaSenha = 'Nova senha é obrigatória';
    } else if (form.novaSenha.length < 6) {
      newErrors.novaSenha = 'Nova senha deve ter no mínimo 6 caracteres';
    }

    if (!form.confirmarSenha.trim()) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (form.novaSenha !== form.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não conferem';
    }

    if (form.senhaAtual === form.novaSenha) {
      newErrors.novaSenha = 'A nova senha deve ser diferente da senha atual';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(changePasswordAsync({
        senhaAtual: form.senhaAtual,
        novaSenha: form.novaSenha,
      })).unwrap();

      Alert.alert(
        'Sucesso',
        'Senha alterada com sucesso!',
        [
          {
            text: 'OK',
            onPress: onClose,
          },
        ]
      );
    } catch (error) {
      // Error já é tratado no useEffect
    }
  };

  const handleInputChange = (field: keyof PasswordForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Alterar Senha
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.closeButtonText, { color: theme.colors.textSecondary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <AuthInputField
              label="Senha Atual"
              placeholder="Sua senha atual"
              value={form.senhaAtual}
              onChangeText={(value) => handleInputChange('senhaAtual', value)}
              error={errors.senhaAtual}
              secureTextEntry
              autoCapitalize="none"
            />

            <AuthInputField
              label="Nova Senha"
              placeholder="Sua nova senha"
              value={form.novaSenha}
              onChangeText={(value) => handleInputChange('novaSenha', value)}
              error={errors.novaSenha}
              secureTextEntry
              autoCapitalize="none"
            />

            <AuthInputField
              label="Confirmar Nova Senha"
              placeholder="Confirme sua nova senha"
              value={form.confirmarSenha}
              onChangeText={(value) => handleInputChange('confirmarSenha', value)}
              error={errors.confirmarSenha}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <AuthButton
              title="Cancelar"
              variant="outline"
              onPress={handleClose}
              disabled={isLoading}
              style={styles.cancelButton}
            />
            
            <AuthButton
              title="Alterar Senha"
              loading={isLoading}
              onPress={handleChangePassword}
              style={styles.saveButton}
            />
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
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

export default SettingsPasswordModal;
