import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { useLocation } from '@/hooks/useLocation';
import { useBiometrics } from '@/hooks/useBiometrics';
import { useUser } from '@/hooks/useUser';
import { useDashboard } from '@/hooks/useDashboard';
import { useQRScanner } from '@/hooks/useQRScanner';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const BARCODE_SETTINGS = { barcodeTypes: ['qr' as const] };

export default function ScannerScreen() {
  const [isFocused, setIsFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  const { user: userData } = useUser();
  const { coordenadas: location, error: locationError, obtenerUbicacion } = useLocation();
  const { autenticar } = useBiometrics();
  const { registrarHomeOffice } = useDashboard(userData);

  const {
    cameraActive,
    setCameraActive,
    scanned,
    setScanned,
    loading,
    validatingPreflight,
    preflightData,
    preflightErrors,
    preflightFailedModal,
    setPreflightFailedModal,
    isHomeOffice,
    resultModalVisible,
    setResultModalVisible,
    modalType,
    setModalType,
    modalMessage,
    setModalMessage,
    modalContext,
    setModalContext,
    validarYIniciarCamara,
    handleBarCodeScanned,
    retryScan,
  } = useQRScanner(userData, obtenerUbicacion);

  const [loadingHO, setLoadingHO] = useState(false);

  // Registro directo en modalidad Home Office con huella digital (sin QR)
  const registrarHomeOfficeDirecto = async () => {
    if (!userData?.id) return;

    // Validación obligatoria con huella digital / Face ID en Home Office
    const ok = await autenticar('Usa tu huella para registrar asistencia en Home Office');
    if (!ok) {
      Alert.alert('Autenticación requerida', 'Debes validar tu huella digital para registrar asistencia en Home Office.');
      return;
    }

    setLoadingHO(true);
    let currentLocation = location;
    if (!currentLocation) {
      currentLocation = await obtenerUbicacion();
    }

    const res = await registrarHomeOffice(currentLocation);
    setLoadingHO(false);

    Haptics.notificationAsync(
      res.success 
        ? Haptics.NotificationFeedbackType.Success 
        : Haptics.NotificationFeedbackType.Error
    );

    setModalType(res.success ? 'success' : 'error');
    setModalContext(res.title);
    setModalMessage(res.message);
    setResultModalVisible(true);
  };

  const closeSuccess = () => {
    setResultModalVisible(false);
    router.replace('/(tab)/' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tab)/' as any)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear Asistencia</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <View style={styles.officeBox}>
          <Ionicons name="business-outline" size={18} color="#475569" style={{ marginRight: 8 }} />
          <Text style={styles.officeTextNormal}>Oficina: </Text>
          <Text style={styles.officeTextBold}>{userData?.oficina_nombre || "Tu Oficina"}</Text>
        </View>

        {isHomeOffice && (
          <View style={styles.hoBanner}>
            <Ionicons name="home" size={20} color="#0369a1" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.hoBannerTitle}>Modalidad Home Office Activa</Text>
              <Text style={styles.hoBannerText}>
                No requieres estar en la red ni geocerca de la oficina.
              </Text>
            </View>
          </View>
        )}

        {isHomeOffice ? (
          <View style={styles.hoContainerCard}>
            <View style={styles.hoIconLargeWrap}>
              <Ionicons name="finger-print" size={54} color="#0284c7" />
            </View>
            <Text style={styles.hoMainTitle}>Modalidad Home Office</Text>
            <Text style={styles.hoMainDesc}>
              El escaneo de código QR de oficina está inhabilitado para tu jornada remota. Por favor registra tu asistencia con tu huella digital.
            </Text>

            <TouchableOpacity 
              style={[styles.btnHoBiometric, loading && { opacity: 0.7 }]} 
              onPress={registrarHomeOfficeDirecto}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="finger-print" size={22} color="#ffffff" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.btnHoBiometricText}>
                {loading ? 'Validando huella...' : 'Checar con Huella Digital'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btnOutline, { marginTop: 10 }]} 
              onPress={() => router.replace('/(tab)/' as any)}
            >
              <Text style={styles.btnOutlineText}>Ir al Dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.instructionText}>
              {cameraActive 
                ? 'Alinea el código QR de la oficina dentro del marco de lectura.'
                : 'Se validará tu conexión a la red de la oficina y tu ubicación GPS antes de activar la cámara.'}
            </Text>

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
                      barcodeScannerSettings={BARCODE_SETTINGS}
                      onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    />
                  )}

                  {scanned && (
                    <View style={styles.scannedOverlay}>
                      <ActivityIndicator size="large" color="#0d6efd" />
                      <Text style={{ marginTop: 10, fontWeight: 'bold', color: '#0d6efd' }}>Procesando lectura...</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {!cameraActive ? (
              <TouchableOpacity 
                style={[styles.btnPrimary, validatingPreflight && { opacity: 0.7 }]} 
                onPress={() => validarYIniciarCamara()}
                disabled={validatingPreflight}
              >
                {validatingPreflight ? (
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="videocam" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.btnPrimaryText}>
                  {validatingPreflight ? 'Verificando entorno...' : 'Validar y activar cámara'}
                </Text>
              </TouchableOpacity>
            ) : scanned ? (
              <TouchableOpacity style={styles.btnOutline} onPress={() => setScanned(false)}>
                <Ionicons name="refresh" size={20} color="#0d6efd" style={{ marginRight: 8 }} />
                <Text style={styles.btnOutlineText}>Escanear de nuevo</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btnOutline} onPress={() => setCameraActive(false)}>
                <Ionicons name="stop-circle-outline" size={20} color="#64748b" style={{ marginRight: 8 }} />
                <Text style={[styles.btnOutlineText, { color: '#64748b' }]}>Detener cámara</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {locationError ? (
          <Text style={[styles.footerText, { color: '#dc2626' }]}>{locationError}</Text>
        ) : location ? (
          <Text style={[styles.footerText, { color: '#16a34a' }]}>
            GPS Activo ({location.accuracy?.toFixed(0)}m de precisión)
          </Text>
        ) : (
          <Text style={styles.footerText}>Conéctate a la red Wi-Fi de la oficina y mantén tu GPS encendido</Text>
        )}
      </ScrollView>

      {/* MODAL DE FALLA EN PRE-VUELO (RED O GEOCERCA NO CUMPLIDAS) */}
      <Modal visible={preflightFailedModal} animationType="fade" transparent={true}>
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

            <TouchableOpacity 
              style={styles.btnRetryModal} 
              onPress={() => {
                setPreflightFailedModal(false);
                validarYIniciarCamara();
              }}
            >
              <Ionicons name="reload" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.btnRetryModalText}>Reintentar comprobación</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.btnCancelModal} 
              onPress={() => {
                setPreflightFailedModal(false);
                router.back();
              }}
            >
              <Text style={styles.btnCancelModalText}>Volver al menú principal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE RESULTADO DE REGISTRO */}
      <Modal visible={resultModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: modalType === 'success' ? '#f0fdf4' : '#fef2f2' }}>
          <View style={styles.modalContainer}>
            {modalType === 'success' ? (
              <Ionicons name="checkmark-circle" size={100} color="#16a34a" />
            ) : (
              <Ionicons name="close-circle" size={100} color="#dc2626" />
            )}
            
            <Text style={[styles.modalTitle, { color: modalType === 'success' ? '#166534' : '#991b1b' }]}>
              {modalType === 'success' ? modalContext : 'Error'}
            </Text>
            
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            
            {modalType === 'success' ? (
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#16a34a' }]} onPress={closeSuccess}>
                <Text style={styles.modalButtonText}>Aceptar y volver al inicio</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#dc2626', marginBottom: 15 }]} onPress={retryScan}>
                  <Text style={styles.modalButtonText}>Reintentar escaneo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnOutlineModal, { width: 250 }]} onPress={closeSuccess}>
                  <Text style={styles.btnOutlineTextModal}>Volver al inicio</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', justifyContent: 'space-between' },
  backButton: { padding: 5, marginLeft: -5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  container: { alignItems: 'center', padding: 20, backgroundColor: '#ffffff' },
  officeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 15 },
  officeTextNormal: { fontSize: 14, color: '#475569' },
  officeTextBold: { fontSize: 14, fontWeight: 'bold', color: '#0d6efd' },
  
  hoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd', borderRadius: 10, padding: 12, marginBottom: 15, width: '100%' },
  hoBannerTitle: { fontSize: 14, fontWeight: 'bold', color: '#0369a1' },
  hoBannerText: { fontSize: 12, color: '#0284c7', marginTop: 2 },

  instructionText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20, paddingHorizontal: 10, lineHeight: 20 },
  
  cameraWrapper: { width: 330, height: 330, position: 'relative', marginBottom: 25 },
  cameraInner: { flex: 1, margin: 15 },
  cameraPlaceholder: { flex: 1, borderRadius: 20, margin: 15, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', padding: 20 },
  cameraPlaceholderTitle: { color: '#64748b', marginTop: 15, fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
  cameraPlaceholderText: { color: '#94a3b8', marginTop: 6, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  
  scannedOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#0d6efd' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 20 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 20 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 20 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 20 },
  
  footerText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 15 },
  
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: '#0d6efd', borderRadius: 12, paddingVertical: 14, marginBottom: 12 },
  btnPrimaryText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  btnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#0d6efd', borderRadius: 12, paddingVertical: 14, marginBottom: 12 },
  btnOutlineText: { color: '#0d6efd', fontSize: 16, fontWeight: '600' },

  btnHomeOffice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc', borderRadius: 12, paddingVertical: 13, marginBottom: 10 },
  btnHomeOfficeText: { color: '#0369a1', fontSize: 14, fontWeight: 'bold' },

  // Estilos de Home Office Biométrico
  hoContainerCard: { width: '100%', backgroundColor: '#f0f9ff', borderRadius: 20, borderWidth: 1, borderColor: '#bae6fd', padding: 24, alignItems: 'center', marginBottom: 20 },
  hoIconLargeWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  hoMainTitle: { fontSize: 18, fontWeight: 'bold', color: '#0369a1', textAlign: 'center', marginBottom: 8 },
  hoMainDesc: { fontSize: 13, color: '#0284c7', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  btnHoBiometric: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: '#0284c7', borderRadius: 12, paddingVertical: 14, marginBottom: 10 },
  btnHoBiometricText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },

  // Modal Diagnóstico de Pre-vuelo
  backdropModal: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  diagnosticCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  diagnosticIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  diagnosticTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  diagnosticSubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  diagnosticList: { width: '100%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  diagnosticItem: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6 },
  diagnosticItemTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  diagnosticItemDesc: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 16 },
  btnRetryModal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d6efd', width: '100%', paddingVertical: 13, borderRadius: 10, marginBottom: 10 },
  btnRetryModalText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  btnCancelModal: { paddingVertical: 10, alignItems: 'center', width: '100%' },
  btnCancelModalText: { color: '#64748b', fontSize: 14, fontWeight: '500' },

  // Modal Resultado
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  modalMessage: { fontSize: 16, color: '#475569', textAlign: 'center', marginTop: 15, marginBottom: 40, lineHeight: 24 },
  modalButton: { width: 250, paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnOutlineModal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: '#0d6efd', borderRadius: 12, paddingVertical: 16 },
  btnOutlineTextModal: { color: '#0d6efd', fontSize: 16, fontWeight: '600' }
});
