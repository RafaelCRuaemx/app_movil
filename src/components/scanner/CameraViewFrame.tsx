import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BARCODE_SETTINGS = { barcodeTypes: ['qr' as const] };

interface CameraViewFrameProps {
  cameraActive: boolean;
  validatingPreflight: boolean;
  isFocused: boolean;
  torch: boolean;
  setTorch: (val: boolean) => void;
  scanned: boolean;
  laserAnim: Animated.Value;
  handleBarCodeScanned: (result: { type: string; data: string }) => void;
}

export function CameraViewFrame({
  cameraActive,
  validatingPreflight,
  isFocused,
  torch,
  setTorch,
  scanned,
  laserAnim,
  handleBarCodeScanned,
}: CameraViewFrameProps) {
  return (
    <View style={styles.cameraWrapper}>
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      {!cameraActive ? (
        <View style={styles.cameraPlaceholder}>
          {validatingPreflight ? (
            <>
              <ActivityIndicator size="large" color="#0d6efd" />
              <Text style={[styles.cameraPlaceholderTitle, { color: '#0d6efd' }]}>Validando requisitos...</Text>
              <Text style={styles.cameraPlaceholderText}>Comprobando red Wi-Fi y distancia GPS...</Text>
            </>
          ) : (
            <>
              <Ionicons name="shield-checkmark-outline" size={48} color="#cbd5e1" />
              <Text style={styles.cameraPlaceholderTitle}>Validación previa requerida</Text>
              <Text style={styles.cameraPlaceholderText}>Presiona el botón para comprobar Wi-Fi y ubicación</Text>
            </>
          )}
        </View>
      ) : (
        <View style={styles.cameraInner}>
          {isFocused && (
            <CameraView 
              style={StyleSheet.absoluteFill} 
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={BARCODE_SETTINGS}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
          )}
          {!scanned && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.laserLine,
                { transform: [{ translateY: laserAnim }] },
              ]}
            />
          )}
          <TouchableOpacity
            style={[styles.torchButton, torch && styles.torchButtonActive]}
            onPress={() => setTorch(!torch)}
            activeOpacity={0.8}
          >
            <Ionicons name={torch ? 'flashlight' : 'flashlight-outline'} size={22} color="#ffffff" />
          </TouchableOpacity>

          {scanned && (
            <View style={styles.scannedOverlay}>
              <ActivityIndicator size="large" color="#0d6efd" />
              <Text style={{ marginTop: 10, fontWeight: 'bold', color: '#0d6efd' }}>Procesando lectura...</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cameraWrapper: {
    width: 300,
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 24,
    backgroundColor: '#000000',
  },
  cameraInner: { flex: 1, position: 'relative' },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cameraPlaceholderTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginTop: 12, textAlign: 'center' },
  cameraPlaceholderText: { fontSize: 13, color: '#64748b', marginTop: 6, textAlign: 'center', lineHeight: 18 },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: '#0d6efd', zIndex: 10 },
  cornerTL: { top: 12, left: 12, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  torchButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  torchButtonActive: {
    backgroundColor: '#0d6efd',
    borderColor: '#3b82f6',
  },
  scannedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  laserLine: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 3,
    backgroundColor: '#38bdf8',
    borderRadius: 2,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 5,
  },
});