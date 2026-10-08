import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Easing, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';

const API_URL = 'http://192.168.100.9/UAEMex/wsl/Checador/backend/api';


export default function ScannerScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const stored = await SecureStore.getItemAsync('userData');
      if (stored) setUserData(JSON.parse(stored));
    };
    loadUser();
  }, []);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  // Valor animado para la línea láser del escáner
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Efecto que controla la animación de la línea
  useEffect(() => {
    if (cameraActive && permission?.granted && !scanned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 295, // Baja hasta el fondo de la caja
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0, // Sube de regreso
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      scanLineAnim.stopAnimation();
      scanLineAnim.setValue(0);
    }
  }, [cameraActive, permission, scanned]);

  const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    setScanned(true);
    setLoading(true);

    try {
      const userId = userData?.id;
      if (!userId) {
        Alert.alert("Error", "No se encontró el ID del usuario.");
        setLoading(false);
        return;
      }

      const postData = {
        usuario_id: userId,
        qr: data,
        lat: location?.coords.latitude || null,
        lon: location?.coords.longitude || null,
        gps_acc: location?.coords.accuracy || null
      };

      const res = await fetch(`${API_URL}/registrar_asistencia_app.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      
      const json = await res.json();
      
      if (json.success) {
        Alert.alert("Éxito", json.message || "Asistencia registrada correctamente.", [
          { text: "OK", onPress: () => router.replace('/(tab)/index' as any) }
        ]);
      } else {
        Alert.alert("Atención", json.motivo || json.message || "No se pudo registrar la asistencia.", [
          { text: "Reintentar", onPress: () => setScanned(false) }
        ]);
      }

    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Ocurrió un problema de red.");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const iniciarCamara = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    
    // Encendemos la cámara inmediatamente para no hacer esperar al usuario
    setCameraActive(true);
    setScanned(false);

    // Solicitamos la ubicación sin bloquear la UI
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError("Permiso de ubicación denegado.");
        } else {
          // Usamos Balanced para que sea rápido y no se quede colgado buscando satélites
          let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setLocation(loc);
          setLocationError(null);
        }
      } catch (e) {
        console.log("Error de ubicación", e);
      }
    })();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear QR</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        
        {/* OFICINA ASIGNADA */}
        <View style={styles.officeBox}>
          <Ionicons name="business-outline" size={18} color="#475569" style={{ marginRight: 8 }} />
          <Text style={styles.officeTextNormal}>Oficina asignada: </Text>
          <Text style={styles.officeTextBold}>{userData?.oficina_nombre || "Tu Oficina"}</Text>
        </View>

        <Text style={styles.instructionText}>
          Alinea el código QR de la oficina dentro del marco de lectura.
        </Text>

        {/* MARCO DE LA CÁMARA */}
        <View style={styles.cameraWrapper}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {(!cameraActive || !permission?.granted) ? (
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="videocam-outline" size={48} color="#cbd5e1" />
              <Text style={styles.cameraPlaceholderTitle}>Activa la cámara para comenzar</Text>
              <Text style={styles.cameraPlaceholderText}>Apunta al QR y mantenlo dentro del cuadro</Text>
            </View>
          ) : (
            <View style={styles.cameraInner}>
              <CameraView 
                style={StyleSheet.absoluteFill} 
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
              
              {/* LÍNEA LÁSER ANIMADA */}
              {!scanned && (
                <View style={StyleSheet.absoluteFill}>
                  <Animated.View 
                    style={[
                      styles.scanLine, 
                      { transform: [{ translateY: scanLineAnim }] }
                    ]} 
                  />
                </View>
              )}

              {scanned && (
                <View style={styles.scannedOverlay}>
                  {loading ? (
                    <>
                      <ActivityIndicator size="large" color="#0d6efd" />
                      <Text style={{ marginTop: 10, fontWeight: 'bold', color: '#0d6efd' }}>Procesando...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={60} color="#16a34a" />
                      <Text style={{ marginTop: 10, fontWeight: 'bold', color: '#16a34a' }}>¡Escaneado!</Text>
                    </>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* BOTÓN ACTIVAR CÁMARA O RE-ESCANEAR */}
        {(!cameraActive || !permission?.granted) ? (
          <TouchableOpacity style={styles.btnOutline} onPress={iniciarCamara}>
            <Ionicons name="videocam" size={20} color="#0d6efd" style={{ marginRight: 8 }} />
            <Text style={styles.btnOutlineText}>Activar cámara</Text>
          </TouchableOpacity>
        ) : scanned ? (
          <TouchableOpacity style={styles.btnOutline} onPress={() => setScanned(false)}>
            <Ionicons name="refresh" size={20} color="#0d6efd" style={{ marginRight: 8 }} />
            <Text style={styles.btnOutlineText}>Escanear de nuevo</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.btnPlaceholder} />
        )}

        {/* TEXTO INFERIOR */}
        {locationError ? (
          <Text style={[styles.footerText, { color: '#dc2626' }]}>{locationError}</Text>
        ) : location ? (
          <Text style={[styles.footerText, { color: '#16a34a' }]}>
            Ubicación obtenida ({location.coords.accuracy?.toFixed(0)}m de precisión)
          </Text>
        ) : cameraActive ? (
          <Text style={styles.footerText}>Obteniendo ubicación...</Text>
        ) : (
          <Text style={styles.footerText}>La ubicación se obtendrá al activar la cámara.</Text>
        )}
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', justifyContent: 'space-between' },
  backButton: { padding: 5, marginLeft: -5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  container: { flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#ffffff' },
  
  officeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, marginBottom: 20 },
  officeTextNormal: { fontSize: 14, color: '#475569' },
  officeTextBold: { fontSize: 14, fontWeight: 'bold', color: '#0d6efd' },
  instructionText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 30, paddingHorizontal: 10 },
  
  cameraWrapper: { width: 330, height: 330, position: 'relative', marginBottom: 30 },
  cameraInner: { flex: 1, margin: 15 },
  cameraPlaceholder: { flex: 1, borderRadius: 20, margin: 15, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', padding: 20 },
  cameraPlaceholderTitle: { color: '#94a3b8', marginTop: 15, fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  cameraPlaceholderText: { color: '#cbd5e1', marginTop: 5, fontSize: 12, textAlign: 'center' },
  
  scanLine: { width: '100%', height: 3, backgroundColor: '#0d6efd', shadowColor: '#0d6efd', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
  scannedOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#0d6efd' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 20 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 20 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 20 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 20 },

  btnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#0d6efd', borderRadius: 8, paddingVertical: 14, marginBottom: 20 },
  btnOutlineText: { color: '#0d6efd', fontSize: 16, fontWeight: '600' },
  btnPlaceholder: { height: 50, marginBottom: 20 }, 
  
  footerText: { fontSize: 13, color: '#94a3b8', textAlign: 'center' }
});
