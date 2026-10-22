import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScanResultModalProps {
  visible: boolean;
  modalType: 'success' | 'error';
  modalContext: string;
  modalMessage: string;
  onCloseSuccess: () => void;
  onRetryScan: () => void;
}

export function ScanResultModal({
  visible,
  modalType,
  modalContext,
  modalMessage,
  onCloseSuccess,
  onRetryScan,
}: ScanResultModalProps) {
  const isSuccess = modalType === 'success';
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.backdropModal}>
        <View style={styles.card}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: isSuccess ? '#dcfce7' : '#fef2f2' },
            ]}
          >
            <Ionicons
              name={isSuccess ? 'checkmark-circle' : 'alert-circle'}
              size={46}
              color={isSuccess ? '#16a34a' : '#dc2626'}
            />
          </View>
          <Text style={styles.title}>
            {isSuccess ? modalContext : 'Aviso de Registro'}
          </Text>
          <Text style={styles.subtitle}>{modalMessage}</Text>
          {isSuccess ? (
            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: '#16a34a' }]}
              onPress={onCloseSuccess}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.btnPrimaryText}>Aceptar y volver al inicio</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: '#0d6efd', marginBottom: 10 }]}
                onPress={onRetryScan}
                activeOpacity={0.8}
              >
                <Ionicons name="reload" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.btnPrimaryText}>Reintentar escaneo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary} onPress={onCloseSuccess} activeOpacity={0.7}>
                <Text style={styles.btnSecondaryText}>Volver al inicio</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdropModal: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 340, backgroundColor: '#ffffff', borderRadius: 24, padding: 24, alignItems: 'center' },
  iconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btnPrimary: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  btnSecondary: { width: '100%', paddingVertical: 12, alignItems: 'center' },
  btnSecondaryText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
});