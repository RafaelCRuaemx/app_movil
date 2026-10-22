import { estaTourActivo, iniciarTourGlobal, registrarElementoTour, verificarTourPrimeraVez } from '@/components/OnboardingModal';
import { CameraViewFrame } from '@/components/scanner/CameraViewFrame';
import { HomeOfficeScannerCard } from '@/components/scanner/HomeOfficeScannerCard';
import { PreflightDiagnosticModal } from '@/components/scanner/PreflightDiagnosticModal';
import { ScanResultModal } from '@/components/scanner/ScanResultModal';
import { useBiometrics } from '@/hooks/useBiometrics';
import { useDashboard } from '@/hooks/useDashboard';
import { useLocation } from '@/hooks/useLocation';
import { useQRScanner } from '@/hooks/useQRScanner';
import { useUser } from '@/hooks/useUser';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScannerScreen() {
  const [isFocused, setIsFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
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
    validatingPreflight,
    preflightData,
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
  const [torch, setTorch] = useState(false);
  const validacionInicialEjecutada = useRef(false);
  const laserAnim = useRef(new Animated.Value(14)).current;

  // Animación continua de la línea láser
  useEffect(() => {
    if (cameraActive && !scanned) {
      laserAnim.setValue(14);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 276,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 14,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [cameraActive, scanned, laserAnim]);

  // Validación inicial de entorno si el tour no está activo
  useEffect(() => {
    if (!userData?.id || validacionInicialEjecutada.current) return;
    validacionInicialEjecutada.current = true;

    (async () => {
      const seAbrioTour = await verificarTourPrimeraVez();
      if (!seAbrioTour && !estaTourActivo()) {
        validarYIniciarCamara(userData);
      }
    })();
  }, [userData?.id, validarYIniciarCamara, userData]);

  const registrarHomeOfficeDirecto = async () => {
    if (!userData?.id) return;

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
        <TouchableOpacity
          onPress={() => {
            setPreflightFailedModal(false);
            iniciarTourGlobal();
          }}
          style={{ padding: 4 }}
        >
          <Ionicons name="help-circle-outline" size={26} color="#0d6efd" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <View ref={registrarElementoTour('scanner_oficina')} collapsable={false} style={styles.officeBox}>
          <Ionicons name="business-outline" size={18} color="#475569" style={{ marginRight: 8 }} />
          <Text style={styles.officeTextNormal}>Oficina: </Text>
          <Text style={styles.officeTextBold}>
            {preflightData?.oficina_nombre || userData?.oficina_nombre || "Tu Oficina"}
          </Text>
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
          <HomeOfficeScannerCard loadingHO={loadingHO} registrarHomeOfficeDirecto={registrarHomeOfficeDirecto} />
        ) : (
          <>
            <Text style={styles.instructionText}>
              {cameraActive 
                ? 'Alinea el código QR de la oficina dentro del marco de lectura.'
                : 'Se validará tu conexión a la red de la oficina y tu ubicación GPS antes de activar la cámara.'}
            </Text>

            <View ref={registrarElementoTour('scanner_marco')} collapsable={false}>
              <CameraViewFrame
                cameraActive={cameraActive}
                validatingPreflight={validatingPreflight}
                isFocused={isFocused}
                torch={torch}
                setTorch={setTorch}
                scanned={scanned}
                laserAnim={laserAnim}
                handleBarCodeScanned={handleBarCodeScanned}
              />
            </View>

            <View ref={registrarElementoTour('scanner_boton')} collapsable={false} style={{ width: '100%', marginBottom: 12 }}>
              {!cameraActive ? (
                <TouchableOpacity 
                  style={[styles.btnPrimary, { marginBottom: 0 }, validatingPreflight && { opacity: 0.7 }]} 
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
                <TouchableOpacity style={[styles.btnOutline, { marginBottom: 0 }]} onPress={() => setScanned(false)}>
                  <Ionicons name="refresh" size={20} color="#0d6efd" style={{ marginRight: 8 }} />
                  <Text style={styles.btnOutlineText}>Escanear de nuevo</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.btnOutline, { marginBottom: 0 }]} onPress={() => setCameraActive(false)}>
                  <Ionicons name="stop-circle-outline" size={20} color="#64748b" style={{ marginRight: 8 }} />
                  <Text style={[styles.btnOutlineText, { color: '#64748b' }]}>Detener cámara</Text>
                </TouchableOpacity>
              )}
            </View>
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

      {/* MODAL DE FALLA EN PRE-VUELO */}
      <PreflightDiagnosticModal
        visible={preflightFailedModal && !estaTourActivo()}
        preflightData={preflightData}
        onRetry={() => {
          setPreflightFailedModal(false);
          validarYIniciarCamara();
        }}
        onClose={() => setPreflightFailedModal(false)}
      />

      {/* MODAL DE RESULTADO */}
      <ScanResultModal
        visible={resultModalVisible}
        modalType={modalType}
        modalContext={modalContext}
        modalMessage={modalMessage}
        onCloseSuccess={closeSuccess}
        onRetryScan={retryScan}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', justifyContent: 'space-between' },
  backButton: { padding: 5, marginLeft: -5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  container: { padding: 24, alignItems: 'center' },
  officeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  officeTextNormal: { color: '#64748b', fontSize: 14 },
  officeTextBold: { color: '#0f172a', fontSize: 14, fontWeight: 'bold' },
  hoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    width: '100%',
  },
  hoBannerTitle: { fontSize: 14, fontWeight: 'bold', color: '#0369a1' },
  hoBannerText: { fontSize: 12, color: '#0284c7', marginTop: 2 },
  instructionText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
  btnPrimary: {
    flexDirection: 'row',
    backgroundColor: '#0d6efd',
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  btnPrimaryText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
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
  btnOutlineText: { color: '#0d6efd', fontSize: 14, fontWeight: '600' },
  footerText: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8 },
});