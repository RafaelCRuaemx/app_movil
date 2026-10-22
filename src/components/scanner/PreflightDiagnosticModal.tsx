import { PreflightDetails } from "@/hooks/useQRScanner";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PreflightDiagnosticModalProps {
    visible: boolean;
    preflightData : PreflightDetails | null;
    onRetry: () => void;
    onClose: () => void;
}

export function PreflightDiagnosticModal({
  visible,
  preflightData,
  onRetry,
  onClose,
}: PreflightDiagnosticModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.backdropModal}>
        <View style={styles.diagnosticCard}>
          <View style={styles.diagnosticIconWrap}>
            <Ionicons name="alert-circle" size={44} color="#dc2626" />
          </View>
          <Text style={styles.diagnosticTitle}>Validación no superada</Text>
          <Text style={styles.diagnosticSubtitle}>
            No es posible abrir la cámara para checar debido a que no cumples los requisitos de seguridad:
          </Text>
          <View style={styles.diagnosticList}>
            {/* DIAGNÓSTICO RED WI-FI */}
            <View style={styles.diagnosticItem}>
              <Ionicons 
                name={preflightData?.red_autorizada === false ? "close-circle" : "checkmark-circle"} 
                size={22} 
                color={preflightData?.red_autorizada === false ? "#dc2626" : "#16a34a"} 
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.diagnosticItemTitle}>Red Wi-Fi de la Oficina</Text>
                <Text style={styles.diagnosticItemDesc}>
                  {preflightData?.red_autorizada === false 
                    ? 'No estás conectado a la red Wi-Fi corporativa registrada.' 
                    : 'Conectado a la red de la oficina.'}
                </Text>
              </View>
            </View>
            {/* DIAGNÓSTICO GEOCERCA */}
            <View style={styles.diagnosticItem}>
              <Ionicons 
                name={preflightData?.geocerca_autorizada === false ? "close-circle" : "checkmark-circle"} 
                size={22} 
                color={preflightData?.geocerca_autorizada === false ? "#dc2626" : "#16a34a"} 
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.diagnosticItemTitle}>Ubicación y Rango de Oficina</Text>
                <Text style={styles.diagnosticItemDesc}>
                  {preflightData?.geocerca_autorizada === false
                    ? `Estás a ${preflightData.distancia_metros ?? '?'}m de la oficina. El rango máximo permitido es de ${preflightData.radio_permitido ?? 100}m.`
                    : 'Dentro del radio permitido.'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.btnRetryModal} onPress={onRetry} activeOpacity={0.8}>
            <Ionicons name="reload" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.btnRetryModalText}>Reintentar comprobación</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.btnCancelModal} 
            onPress={() => {
              onClose();
              router.replace('/(tab)/' as any);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.btnCancelModalText}>Volver al menú principal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdropModal: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  diagnosticCard: { width: '100%', maxWidth: 360, backgroundColor: '#ffffff', borderRadius: 24, padding: 24, alignItems: 'center' },
  diagnosticIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  diagnosticTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  diagnosticSubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  diagnosticList: { width: '100%', backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 20 },
  diagnosticItem: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6 },
  diagnosticItemTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  diagnosticItemDesc: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 16 },
  btnRetryModal: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#0d6efd',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  btnRetryModalText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  btnCancelModal: { width: '100%', paddingVertical: 12, alignItems: 'center' },
  btnCancelModalText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
});