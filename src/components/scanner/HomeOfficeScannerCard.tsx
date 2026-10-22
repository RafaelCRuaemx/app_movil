import { registrarElementoTour } from "@/components/OnboardingModal";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HomeOfficeScannerCardProps {
    loadingHO: boolean;
    registrarHomeOfficeDirecto: () => void;
}

export function HomeOfficeScannerCard({ loadingHO, registrarHomeOfficeDirecto }: HomeOfficeScannerCardProps) {
  return (
    <View ref={registrarElementoTour('scanner_marco')} collapsable={false} style={styles.hoContainerCard}>
      <View style={styles.hoIconLargeWrap}>
        <Ionicons name="finger-print" size={54} color="#0284c7" />
      </View>
      <Text style={styles.hoMainTitle}>Modalidad Home Office</Text>
      <Text style={styles.hoMainDesc}>
        El escaneo de código QR de oficina está inhabilitado para tu jornada remota. Por favor registra tu asistencia con tu huella digital.
      </Text>
      <View ref={registrarElementoTour('scanner_boton')} collapsable={false} style={{ width: '100%', marginBottom: 10 }}>
        <TouchableOpacity 
          style={[styles.btnHoBiometric, { marginBottom: 0 }, loadingHO && { opacity: 0.7 }]} 
          onPress={registrarHomeOfficeDirecto}
          disabled={loadingHO}
          activeOpacity={0.8}
        >
          {loadingHO ? (
            <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="finger-print" size={22} color="#ffffff" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.btnHoBiometricText}>
            {loadingHO ? 'Validando huella...' : 'Checar con Huella Digital'}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        style={[styles.btnOutline, { marginTop: 10 }]} 
        onPress={() => router.replace('/(tab)/' as any)}
        activeOpacity={0.7}
      >
        <Text style={styles.btnOutlineText}>Ir al Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  hoContainerCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  hoIconLargeWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  hoMainTitle: { fontSize: 18, fontWeight: 'bold', color: '#0369a1', marginBottom: 8, textAlign: 'center' },
  hoMainDesc: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  btnHoBiometric: {
    flexDirection: 'row',
    backgroundColor: '#0284c7',
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  btnHoBiometricText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  btnOutline: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    width: '100%',
  },
  btnOutlineText: { color: '#475569', fontSize: 14, fontWeight: '600' },
});