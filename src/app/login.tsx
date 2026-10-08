import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Modal 
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

// Cambia esta IP si cambia tu red local
const API_URL = 'http://192.168.100.9/UAEMex/wsl/Checador/backend/api';

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasSavedDeviceKey, setHasSavedDeviceKey] = useState(false);

  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [tempAuthData, setTempAuthData] = useState<any>(null);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricSupported(hardware && enrolled);
    
    const savedKey = await SecureStore.getItemAsync('deviceKey');
    if (savedKey) {
      setHasSavedDeviceKey(true);
      // Auto-disparar la huella inmediatamente al abrir la app
      setTimeout(() => {
        handleBiometricLogin(savedKey);
      }, 500);
    }
  };

  const generateDeviceKey = () => {
    return 'movil_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleBiometricLogin = async (keyOverride?: string) => {
    try {
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Usa tu huella para iniciar sesión',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: true,
      });

      if (authResult.success) {
        setLoading(true);
        const deviceKey = keyOverride && typeof keyOverride === 'string' ? keyOverride : await SecureStore.getItemAsync('deviceKey');
        
        const response = await fetch(`${API_URL}/login_biometrico_app.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_key: deviceKey })
        });

        const data = await response.json();

        if (data.success) {
          await SecureStore.setItemAsync('userData', JSON.stringify(data.user));
          router.replace('/(tab)');
        } else {
          Alert.alert('Aviso', data.message);
          await SecureStore.deleteItemAsync('deviceKey');
          setHasSavedDeviceKey(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleNormalLogin = async () => {
    if (!correo || !password) {
      Alert.alert('Aviso', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login_app.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });

      const data = await response.json();

      if (data.success) {
        if (isBiometricSupported && !hasSavedDeviceKey) {
          // Mostrar nuestro modal personalizado en lugar del Alert
          setTempAuthData({ user: data.user, email: correo, pass: password });
          setShowBiometricPrompt(true);
        } else {
          finalizaLogin(data.user);
        }
      } else {
        Alert.alert('Acceso Denegado', data.message || 'Error desconocido.');
      }
    } catch (error) {
      Alert.alert('Error de red', 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const confirmarVinculacion = () => {
    setShowBiometricPrompt(false);
    if (tempAuthData) {
      linkDevice(tempAuthData.user, tempAuthData.email, tempAuthData.pass);
    }
  };

  const omitirVinculacion = () => {
    setShowBiometricPrompt(false);
    if (tempAuthData) {
      finalizaLogin(tempAuthData.user);
    }
  };

  const linkDevice = async (user: any, email: string, pass: string) => {
    try {
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu huella para vincular este equipo',
      });

      if (authResult.success) {
        setLoading(true);
        const newDeviceKey = generateDeviceKey();
        
        const response = await fetch(`${API_URL}/registrar_dispositivo_app.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            correo: email, 
            password: pass, 
            device_key: newDeviceKey,
            nombre_device: Platform.OS === 'ios' ? 'iPhone' : 'Android'
          })
        });

        const data = await response.json();

        if (data.success) {
          await SecureStore.setItemAsync('deviceKey', newDeviceKey);
          setHasSavedDeviceKey(true);
          finalizaLogin(user);
        } else {
          Alert.alert('No se pudo vincular', data.message);
          finalizaLogin(user);
        }
      } else {
        finalizaLogin(user);
      }
    } catch (error) {
      finalizaLogin(user);
    } finally {
      setLoading(false);
    }
  };

  const finalizaLogin = async (user: any) => {
    await SecureStore.setItemAsync('userData', JSON.stringify(user));
    router.replace('/(tab)');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="business" size={40} color="#0d6efd" />
          </View>
          <Text style={styles.title}>ActiV2</Text>
          <Text style={styles.subtitle}>Acceso Institucional</Text>
        </View>

        {hasSavedDeviceKey ? (
          // PANTALLA CUANDO EL DISPOSITIVO YA ESTÁ VINCULADO
          <View style={styles.biometricContainer}>
            <Text style={styles.biometricText}>Este dispositivo está vinculado a una cuenta.</Text>
            <TouchableOpacity 
              style={styles.biometricBtn} 
              onPress={() => handleBiometricLogin()}
              disabled={loading}
            >
              <Ionicons name="finger-print" size={40} color="white" />
            </TouchableOpacity>
            <Text style={styles.biometricSub}>Toca para ingresar</Text>
          </View>
        ) : (
          // PANTALLA NORMAL CUANDO NO HAY DISPOSITIVO VINCULADO
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={20} color="#6c757d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#adb5bd"
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={20} color="#6c757d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#adb5bd"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleNormalLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Entrar al Sistema</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

      </View>

      {/* Modal Personalizado para Vincular Dispositivo */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showBiometricPrompt}
        onRequestClose={omitirVinculacion}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Ionicons name="finger-print" size={40} color="#0d6efd" />
            </View>
            <Text style={styles.modalTitle}>Acceso Rápido y Seguro</Text>
            <Text style={styles.modalText}>
              ¿Deseas vincular este dispositivo a tu cuenta? 
              La próxima vez podrás iniciar sesión al instante solo con tu huella digital o rostro, sin tener que escribir tu contraseña.
            </Text>
            
            <TouchableOpacity style={styles.modalBtnPrimary} onPress={confirmarVinculacion}>
              <Text style={styles.modalBtnPrimaryText}>Sí, vincular mi huella</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalBtnSecondary} onPress={omitirVinculacion}>
              <Text style={styles.modalBtnSecondaryText}>No por ahora</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(13, 110, 253, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 28, fontWeight: '800', color: '#212529', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#6c757d', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  
  formContainer: { width: '100%' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#dee2e6', borderRadius: 8, marginBottom: 16, paddingHorizontal: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#212529' },
  button: { backgroundColor: '#0d6efd', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { backgroundColor: '#86b7fe' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  biometricContainer: { alignItems: 'center', paddingVertical: 20 },
  biometricText: { textAlign: 'center', color: '#495057', marginBottom: 30, fontSize: 15 },
  biometricBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0d6efd', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#0d6efd', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.3, shadowRadius: 8 },
  biometricSub: { marginTop: 15, fontSize: 14, fontWeight: 'bold', color: '#0d6efd' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 30, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 15, textAlign: 'center' },
  modalText: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  modalBtnPrimary: { backgroundColor: '#0d6efd', width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  modalBtnPrimaryText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalBtnSecondary: { paddingVertical: 10 },
  modalBtnSecondaryText: { color: '#64748b', fontSize: 15, fontWeight: '600' }
});
