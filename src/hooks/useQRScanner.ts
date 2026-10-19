import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { apiPost } from '@/config/api';
import { getCachedPreflight, clearCachedPreflight } from '@/config/preflightCache';
import { programarAlertaComida, cancelarAlertaComida } from '@/services/notificationService';

export interface PreflightDetails {
  es_home_office: boolean;
  oficina_nombre?: string;
  radio_permitido?: number;
  distancia_metros?: number | null;
  red_autorizada?: boolean;
  geocerca_autorizada?: boolean;
}

export function useQRScanner(userData?: any, obtenerUbicacion?: () => Promise<any>) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [validatingPreflight, setValidatingPreflight] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados de Pre-vuelo
  const [preflightData, setPreflightData] = useState<PreflightDetails | null>(null);
  const [preflightFailedModal, setPreflightFailedModal] = useState(false);
  const [preflightErrors, setPreflightErrors] = useState<string[]>([]);
  const [isHomeOffice, setIsHomeOffice] = useState(false);

  // Estados para modal de resultado de escaneo
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalMessage, setModalMessage] = useState('');
  const [modalContext, setModalContext] = useState('');

  // 1. Procesa el resultado de validación de pre-vuelo
  const procesarResultadoPreflight = useCallback(
    async (preflightRes: any) => {
      if (preflightRes.es_home_office) {
        setIsHomeOffice(true);
        setValidatingPreflight(false);
        setCameraActive(false);
        return;
      }

      // Si no se autoriza el escaneo (por red Wi-Fi o geocerca)
      if (!preflightRes.permitir_escanear) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setValidatingPreflight(false);
        setCameraActive(false);
        setPreflightErrors(
          preflightRes.errores || [preflightRes.message || 'No cumples con las condiciones para escanear.']
        );
        setPreflightData(preflightRes.detalles || null);
        setPreflightFailedModal(true);
        return;
      }

      // Si las condiciones fueron exitosas, verificar permisos de cámara
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
    },
    [permission?.granted, requestPermission]
  );

  // 2. Validación de Pre-Vuelo antes de encender la cámara
  const validarYIniciarCamara = useCallback(
    async (userParam?: any) => {
      const user = userParam || userData;
      if (!user?.id) return;

      // Si la validación ya fue pre-cargada durante la huella, usarla en 0ms
      const cached = getCachedPreflight();
      if (cached) {
        clearCachedPreflight();
        await procesarResultadoPreflight(cached.preflightRes);
        return;
      }

      setValidatingPreflight(true);

      try {
        const loc = obtenerUbicacion ? await obtenerUbicacion() : null;
        if (!loc) {
          setValidatingPreflight(false);
          Alert.alert(
            'Ubicación requerida',
            'Es indispensable otorgar permiso de ubicación para verificar que estás dentro del rango de la oficina antes de abrir la cámara.'
          );
          return;
        }

        const preflightRes = await apiPost('validar_prevuelo_app.php', {
          usuario_id: user.id,
          lat: loc.latitude,
          lon: loc.longitude,
        });

        await procesarResultadoPreflight(preflightRes);
      } catch (error: any) {
        setValidatingPreflight(false);
        Alert.alert('Error de conexión', 'No se pudo validar el estado de red y geocerca: ' + error.message);
      }
    },
    [userData, obtenerUbicacion, procesarResultadoPreflight]
  );

  useEffect(() => {
    if (userData?.id) {
      validarYIniciarCamara(userData);
    }
  }, [userData?.id, validarYIniciarCamara]);

  // 3. Procesar código QR al escanear
  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    const currentLocation = obtenerUbicacion ? await obtenerUbicacion() : null;
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

      const o = qrPayload.o !== undefined ? qrPayload.o : qrPayload.oficina_id;
      const t = qrPayload.t !== undefined ? qrPayload.t : qrPayload.totp;

      if (o === undefined || !t) {
        setLoading(false);
        setModalType('error');
        setModalMessage(`QR incompleto o no reconocido.\nContenido: ${cleanData}`);
        setResultModalVisible(true);
        return;
      }

      const json = await apiPost('registrar_asistencia_app.php', {
        usuario_id: userData?.id,
        qr: cleanData,
        qr_payload: cleanData,
        lat: currentLocation.latitude,
        latitud: currentLocation.latitude,
        lon: currentLocation.longitude,
        longitud: currentLocation.longitude,
        gps_acc: currentLocation.accuracy,
      });

      setLoading(false);

      if (json.success) {
        const tipo = (json.tipo || json.message || '').toLowerCase();
        if (tipo.includes('comida') && (tipo.includes('salida') || tipo.includes('comer') || tipo.includes('comidasalida'))) {
          programarAlertaComida(45);
        } else if (tipo.includes('regreso') || tipo.includes('volver') || tipo.includes('comidaentrada')) {
          cancelarAlertaComida();
        }

        setModalType('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const msg = json.message || 'Asistencia registrada con éxito.';
        let context = 'Registro exitoso';

        if (msg.toLowerCase().includes('entrada')) context = '¡Excelente inicio de jornada!';
        else if (msg.toLowerCase().includes('comer') || msg.toLowerCase().includes('comida')) context = '¡Buen provecho, disfruta tu descanso!';
        else if (msg.toLowerCase().includes('salida')) context = 'Jornada finalizada. ¡Buen descanso!';

        setModalMessage(msg);
        setModalContext(context);
        setResultModalVisible(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setModalType('error');
        setModalMessage(json.motivo || json.message || 'Ocurrió un error al registrar.');
        setResultModalVisible(true);
      }
    } catch (e: any) {
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setModalType('error');
      setModalMessage('No se pudo conectar con el servidor: ' + e.message);
      setResultModalVisible(true);
    }
  };

  // 4. Reintentar escaneo
  const retryScan = () => {
    setResultModalVisible(false);
    setScanned(false);
    setCameraActive(true);
  };

  return {
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
  };
}