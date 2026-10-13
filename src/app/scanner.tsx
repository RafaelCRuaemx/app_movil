import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { API_URL } from '../config/api';
import { clearCachedPreflight, getCachedPreflight } from '../config/preflightCache';
const BARCODE_SETTINGS = { barcodeTypes: ['qr' as const] };

interface PreflightDetails {
  es_home_office: boolean;
  oficina_nombre?: string;
  radio_permitido?: number;
  distancia_metros?: number | null;
  red_autorizada?: boolean;
  geocerca_autorizada?: boolean;
}

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

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [validatingPreflight, setValidatingPreflight] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  // Estados de Pre-vuelo
  const [preflightData, setPreflightData] = useState<PreflightDetails | null>(null);
  const [preflightFailedModal, setPreflightFailedModal] = useState(false);
  const [preflightErrors, setPreflightErrors] = useState<string[]>([]);
  const [isHomeOffice, setIsHomeOffice] = useState(false);

  // Modal de resultado de escaneo
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalMessage, setModalMessage] = useState('');
  const [modalContext, setModalContext] = useState(''); 

  // 1. Cargar usuario y ejecutar automáticamente la validación de entorno
  useEffect(() => {
    const initScanner = async () => {
      const stored = await SecureStore.getItemAsync('userData');
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUserData(parsedUser);
        //  Dispara la validación de Wi-Fi, GPS y apertura de cámara en automático
        validarYIniciarCamara(parsedUser);
      }
    };
    initScanner();
  }, []);

  // Procesa el resultado de validación (usado tanto por caché anticipado como por validación en vivo)
  const procesarResultadoPreflight = async (preflightRes: any) => {
    if (preflightRes.es_home_office) {
      setIsHomeOffice(true);
      setValidatingPreflight(false);
      setCameraActive(false);
      return;
    }

    // Si no se autoriza el escaneo (por red Wi-Fi o geocerca)
    if (!preflightRes.permitir_escanear) {
      setValidatingPreflight(false);
      setCameraActive(false);
      setPreflightErrors(preflightRes.errores || [preflightRes.message || 'No cumples con las condiciones para escanear.']);
      setPreflightData(preflightRes.detalles || null);
      setPreflightFailedModal(true);
      return;
    }

    // 3. Si las validaciones fueron exitosas, verificar permisos de cámara y activar
    setPreflightData(preflightRes.detalles || null);

    if (!permission?.granted) {
      const { status: camStatus } = await requestPermission();
      if (camStatus !== 'granted') {
        setValidatingPreflight(false);
        Alert.alert('Aviso', 'Se requieren permisos de cámara para poder escanear el QR.');
        return;
      }
    }

    setValidatingPreflight(false);
    setCameraActive(true);
    setScanned(false);
  };

  // Validación de Pre-Vuelo antes de encender la cámara
  const validarYIniciarCamara = async (userParam?: any) => {
    const user = userParam || userData;
    if (!user?.id) {
      Alert.alert('Error', 'No se encontró la sesión de usuario activa.');
      return;
    }

    // Si la validación ya fue pre-cargada mientras se autenticaba la huella, consumirla de inmediato (0ms de espera)
    const cached = getCachedPreflight();
    if (cached) {
      clearCachedPreflight();
      if (cached.location) setLocation(cached.location);
      await procesarResultadoPreflight(cached.preflightRes);
      return;
    }

    setValidatingPreflight(true);
    setLocationError(null);

    try {
      // 1. Verificar permiso sin invocar diálogo nativo si ya fue otorgado
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }

      if (status !== 'granted') {
        setValidatingPreflight(false);
        setLocationError('Permiso de ubicación GPS denegado.');
        Alert.alert(
          'Ubicación requerida',
          'Es indispensable otorgar permiso de ubicación para verificar que estás dentro del rango de la oficina antes de abrir la cámara.'
        );
        return;
      }

      // 2. Adquisición ultra-rápida de GPS (prioriza última posición conocida en ~30ms)
      let loc = location;
      const ahora = Date.now();

      // Si ya teníamos una posición reciente en memoria (menos de 20 seg), reutilizarla de inmediato
      if (!loc || (ahora - loc.timestamp > 20000)) {
        try {
          const lastKnown = await Location.getLastKnownPositionAsync();
          if (lastKnown && (ahora - lastKnown.timestamp < 30000)) {
            loc = lastKnown;
          } else {
            // Si no hay posición reciente en caché, obtenerla con carrera y timeout de 3.5s
            const freshPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
            const fresh = await Promise.race([freshPromise, timeoutPromise]);
            loc = fresh || lastKnown;
          }
        } catch (eGps) {
          // Fallback a posición en caché si existía
        }
      }

      // Si aún no hay posición en hardware, último intento directo
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }

      setLocation(loc);

      // 3. Ejecutar validación de pre-vuelo con el backend
      const res = await fetch(`${API_URL}/validar_prevuelo_app.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: user.id,
          lat: loc?.coords.latitude,
          lon: loc?.coords.longitude
        })
      });

      const responseText = await res.text();
      let preflightRes: any;
      try {
        preflightRes = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Respuesta inválida del servidor: ' + responseText.substring(0, 80));
      }

      await procesarResultadoPreflight(preflightRes);

    } catch (error: any) {
      setValidatingPreflight(false);
      Alert.alert('Error de conexión', 'No se pudo validar el estado de red y geocerca: ' + error.message);
    }
  };

  // Registro directo en modalidad Home Office con huella digital (sin QR)
  const registrarHomeOfficeDirecto = async () => {
    if (!userData?.id) return;

    // Validación obligatoria con huella digital / Face ID en Home Office
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Usa tu huella para registrar asistencia en Home Office',
          cancelLabel: 'Cancelar',
          disableDeviceFallback: false,
        });

        if (!authResult.success) {
          Alert.alert('Autenticación requerida', 'Debes validar tu huella digital para registrar asistencia en Home Office.');
          return;
        }
      }
    } catch (e) {
      console.log('Error biometric:', e);
    }

    setLoading(true);

    let currentLocation = location;
    if (!currentLocation) {
      try {
        currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(currentLocation);
      } catch (e) {}
    }

    try {
      const res = await fetch(`${API_URL}/registrar_asistencia_home_office_app.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: userData.id,
          lat: currentLocation?.coords.latitude,
          lon: currentLocation?.coords.longitude,
          gps_acc: currentLocation?.coords.accuracy
        })
      });

      const json = await res.json();
      setLoading(false);

      if (json.success) {
        setModalType('success');
        let tipo = json.tipo || 'asistencia';
        let context = 'Registro Home Office Exitoso';
        if (tipo === 'entrada') context = '¡Excelente inicio de jornada remota!';
        else if (tipo === 'comidaSalida') context = '¡Buen provecho, disfruta tu descanso!';
        else if (tipo === 'comidaEntrada') context = '¡Bienvenido de vuelta a tus labores!';
        else if (tipo === 'salida') context = 'Jornada remota finalizada. ¡Buen descanso!';

        setModalContext(context);
        setModalMessage(`Registrado correctamente a las ${json.registro?.hora || ''} en modalidad Home Office.`);
        setResultModalVisible(true);
      } else {
        setModalType('error');
        setModalMessage(json.motivo || json.message || 'No fue posible registrar asistencia remota.');
        setResultModalVisible(true);
      }
    } catch (e: any) {
      setLoading(false);
      setModalType('error');
      setModalMessage('Error de red: ' + e.message);
      setResultModalVisible(true);
    }
  };

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    let currentLocation = location;
    if (!currentLocation) {
      try {
        currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(currentLocation);
      } catch (e) {}
    }

    if (!currentLocation) {
      setLoading(false);
      setModalType('error');
      setModalMessage('Aún no hemos obtenido tu ubicación GPS. Por favor reintenta.');
      setResultModalVisible(true);
      return;
    }

    try {
      const cleanData = (data || '').trim();
      let qrPayload: any;
      try {
        qrPayload = JSON.parse(cleanData);
      } catch (e) {
        setLoading(false);
        setModalType('error');
        setModalMessage(`El código QR no es válido para este sistema.\nLeído: ${cleanData}`);
        setResultModalVisible(true);
        return;
      }

      let o = qrPayload.o !== undefined ? qrPayload.o : qrPayload.oficina_id;
      let t = qrPayload.t !== undefined ? qrPayload.t : qrPayload.totp;

      if (o === undefined || !t) {
        setLoading(false);
        setModalType('error');
        setModalMessage(`QR incompleto o no reconocido.\nContenido: ${cleanData}`);
        setResultModalVisible(true);
        return;
      }

      const res = await fetch(`${API_URL}/registrar_asistencia_app.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: userData?.id,
          qr: cleanData,
          qr_payload: cleanData,
          lat: currentLocation.coords.latitude,
          latitud: currentLocation.coords.latitude,
          lon: currentLocation.coords.longitude,
          longitud: currentLocation.coords.longitude,
          gps_acc: currentLocation.coords.accuracy
        })
      });

      const responseText = await res.text();
      let json;
      try {
        json = JSON.parse(responseText);
      } catch(e) {
        throw new Error('Respuesta del servidor no es JSON válido: ' + responseText.substring(0, 100));
      }

      setLoading(false);

      if (json.success) {
        setModalType('success');
        let msg = json.message || 'Asistencia registrada con éxito.';
        let context = 'Registro exitoso';

        if (msg.toLowerCase().includes('entrada')) context = '¡Excelente inicio de jornada!';
        else if (msg.toLowerCase().includes('comer') || msg.toLowerCase().includes('comida')) context = '¡Buen provecho, disfruta tu descanso!';
        else if (msg.toLowerCase().includes('salida')) context = 'Jornada finalizada. ¡Buen descanso!';
        
        setModalMessage(msg);
        setModalContext(context);
        setResultModalVisible(true);
      } else {
        setModalType('error');
        setModalMessage(json.motivo || json.message || 'Ocurrió un error al registrar.');
        setResultModalVisible(true);
      }

    } catch (e: any) {
      setLoading(false);
      setModalType('error');
      setModalMessage('No se pudo conectar con el servidor: ' + e.message);
      setResultModalVisible(true);
    }
  };

  const closeSuccess = () => {
    setResultModalVisible(false);
    router.replace('/(tab)/' as any);
  };

  const retryScan = () => {
    setResultModalVisible(false);
    setScanned(false);
    setCameraActive(true);
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
            GPS Activo ({location.coords.accuracy?.toFixed(0)}m de precisión)
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
