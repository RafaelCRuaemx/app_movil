import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiPost } from '@/config/api';

export function usePerfil(usuarioId?: number | string) {
  const [perfilData, setPerfilData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Obtener los datos del perfil desde el servidor
  const fetchPerfil = useCallback(async () => {
    if (!usuarioId) return;
    setLoading(true);
    try {
      const json = await apiPost('perfil_app.php', { usuario_id: usuarioId });

      if (json.success) {
        setPerfilData(json.perfil);
      }
    } catch (e) {
      console.log('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    if (usuarioId) {
      fetchPerfil();
    }
  }, [usuarioId, fetchPerfil]);

  // 2. Subir imagen en Base64 al servidor
  const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!usuarioId) {
      Alert.alert('Error', 'No se encontró sesión de usuario.');
      return;
    }
    setLoading(true);
    try {
      const json = await apiPost('subir_foto_perfil_app.php', {
        usuario_id: usuarioId,
        foto_base64: asset.base64,
      });

      if (json.success) {
        Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');
        fetchPerfil();
      } else {
        Alert.alert('Error al subir', json.message || 'El servidor rechazó la imagen.');
      }
    } catch (e: any) {
      console.log('Error de subida:', e);
      Alert.alert('Error de subida', e.message || 'Error de red al procesar la imagen');
    } finally {
      setLoading(false);
    }
  };

  // 3. Eliminar foto de perfil
  const deleteImage = async () => {
    if (!usuarioId) return;
    setLoading(true);
    try {
      const json = await apiPost('eliminar_foto_perfil_app.php', { usuario_id: usuarioId });
      if (json.success) {
        Alert.alert('Éxito', 'Foto eliminada');
        fetchPerfil();
      } else {
        Alert.alert('Error', json.message || 'Error al eliminar');
      }
    } catch (e) {
      console.log('Error al eliminar:', e);
      Alert.alert('Error', 'Error de red al eliminar la imagen');
    } finally {
      setLoading(false);
    }
  };

  // 4. Seleccionar imagen desde la Cámara o la Galería
  const pickImage = async (fromCamera: boolean) => {
    try {
      let result;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Error', 'Se requiere permiso de cámara');
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Error', 'Se requiere permiso de galería');
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadImage(result.assets[0]);
      }
    } catch (e: any) {
      console.log('Error picker:', e);
      Alert.alert('Error', 'No se pudo seleccionar la imagen: ' + (e?.message || e));
    }
  };

  // 5. Diálogo de opciones del avatar
  const handleAvatarPress = () => {
    Alert.alert('Foto de perfil', '¿Qué deseas hacer?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tomar foto', onPress: () => pickImage(true) },
      { text: 'Elegir de galería', onPress: () => pickImage(false) },
      ...(perfilData?.foto_perfil
        ? [{ text: 'Eliminar foto', onPress: deleteImage, style: 'destructive' as const }]
        : []),
    ]);
  };

  // 6. Helpers de presentación
  const userName = perfilData?.nombre || 'Cargando...';
  const userEmail = perfilData?.correo || 'Cargando...';
  const userRole = perfilData?.rol || 'Colaborador';

  const getInitials = (name?: string) => {
    if (!name) return 'RC';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return {
    perfilData,
    loading,
    userName,
    userEmail,
    userRole,
    getInitials,
    fetchPerfil,
    handleAvatarPress,
  };
}

