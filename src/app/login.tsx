import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const {
    correo,
    setCorreo,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loading,
    hasSavedDeviceKey,
    showBiometricPrompt,
    showTotpModal,
    totpCode,
    setTotpCode,
    handleBiometricLogin,
    handleNormalLogin,
    handleVerificarTotp,
    confirmarVinculacion,
    cancelarVinculacion,
    cerrarTotpModal,
  } = useAuth();


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
              {loading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <Ionicons name="finger-print" size={40} color="white" />
              )}
            </TouchableOpacity>
            <Text style={styles.biometricSub}>
              {loading ? 'Iniciando sesión...' : 'Toca para ingresar'}
            </Text>
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

            <View style = {styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={20} color="#6c757d" style={styles.inputIcon} />
  <TextInput
    style={styles.input}
    placeholder="Contraseña"
    placeholderTextColor="#adb5bd"
    value={password}
    onChangeText={setPassword}
    secureTextEntry={!showPassword} // Si showPassword es false se oculta, si es true se muestra
  />
  <TouchableOpacity 
    onPress={() => setShowPassword(!showPassword)}
    style={{ padding: 4 }}
  >
    <Ionicons 
      name={showPassword ? "eye-off-outline" : "eye-outline"} 
      size={22} 
      color="#6c757d" 
    />
  </TouchableOpacity>
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
        onRequestClose={cancelarVinculacion}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Ionicons name="shield-checkmark" size={40} color="#0d6efd" />
            </View>
            <Text style={styles.modalTitle}>Vinculación Obligatoria 1 a 1</Text>
            <Text style={styles.modalText}>
              Por políticas de seguridad institucional, tu cuenta debe quedar vinculada exclusivamente a este teléfono. 
              {'\n\n'}
              A partir de ahora iniciarás sesión con tu huella dactilar y nadie más podrá checar por ti desde otro celular.
            </Text>
            
            <TouchableOpacity style={styles.modalBtnPrimary} onPress={confirmarVinculacion}>
              <Text style={styles.modalBtnPrimaryText}>Vincular mi huella a este equipo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalBtnSecondary} onPress={cancelarVinculacion}>
              <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 2FA: Verificación con Google Authenticator para Administrativos */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showTotpModal}
        onRequestClose={cerrarTotpModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={[styles.modalIconBox, { backgroundColor: '#e8f0fe' }]}>
              <Ionicons name="shield-checkmark" size={40} color="#1a73e8" />
            </View>
            <Text style={styles.modalTitle}>Verificación en 2 Pasos</Text>
            <Text style={styles.modalText}>
              Ingresa el código dinámico de 6 dígitos generado por tu aplicación de <Text style={{ fontWeight: 'bold', color: '#1a73e8' }}>Google Authenticator</Text>.
            </Text>

            <View style={styles.totpInputContainer}>
              <TextInput
                style={styles.totpInput}
                placeholder="••••••"
                placeholderTextColor="#adb5bd"
                value={totpCode}
                onChangeText={(text) => setTotpCode(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={true}
                textAlign="center"
              />
            </View>

            <TouchableOpacity 
              style={[styles.modalBtnPrimary, { backgroundColor: '#1a73e8' }, loading && styles.buttonDisabled]} 
              onPress={handleVerificarTotp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalBtnPrimaryText}>Verificar Código</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalBtnSecondary} 
              onPress={cerrarTotpModal}
              disabled={loading}
            >
              <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal 
        transparent={true} 
        visible={loading && hasSavedDeviceKey} 
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingVertical: 35 }]}>
            <ActivityIndicator size="large" color="#0d6efd" style={{ marginBottom: 15 }} />
            <Text style={styles.modalTitle}>Acceso Seguro</Text>
            <Text style={styles.modalText}>Identidad verificada. Preparando el checador...</Text>
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
  modalBtnSecondaryText: { color: '#64748b', fontSize: 15, fontWeight: '600' },

  totpInputContainer: {
    width: '100%',
    marginBottom: 25,
    alignItems: 'center',
  },
  totpInput: {
    width: '85%',
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    paddingVertical: 14,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 10,
    color: '#1a73e8',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#d2e3fc',
  },
});
