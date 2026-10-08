import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!correo || !password) {
      Alert.alert('Aviso', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    /* 
      ===============================================================
      AQUÍ EMPEZAREMOS A CONECTAR CON PHP EN EL SIGUIENTE PASO
      Reemplazaremos este simulador por un fetch() a tu API.
      ===============================================================
    */
    setTimeout(async () => {
      if (correo.toLowerCase() === 'test@test.com' && password === '123456') {
        await SecureStore.setItemAsync('userToken', 'TOKEN_SIMULADO');
        router.replace('/(tab)');
      } else {
        Alert.alert('Acceso Denegado', 'Credenciales incorrectas. Intenta con test@test.com y 123456');
      }
      setLoading(false);
    }, 1500);
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
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Entrar al Sistema</Text>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // bg-light
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(13, 110, 253, 0.1)', // Azul claro de fondo
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#212529',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#212529',
  },
  button: {
    backgroundColor: '#0d6efd', // El primary-color de tu web
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0d6efd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonDisabled: {
    backgroundColor: '#86b7fe',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
