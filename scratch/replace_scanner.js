const fs = require('fs');

let content = fs.readFileSync('src/app/scanner.tsx', 'utf8');

const imports = `import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Easing, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';

const API_URL = 'http://192.168.100.9/UAEMex/wsl/Checador/backend/api';
`;

content = content.replace(/^.*import \{ router \} from 'expo-router';/ms, imports);

content = content.replace(
  /export default function ScannerScreen\(\) \{/,
  `export default function ScannerScreen() {
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
  }, []);`
);

content = content.replace(
  /const handleBarCodeScanned = \(\{ type, data \}: \{ type: string, data: string \}\) => \{[\s\S]*?\};/,
  `const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
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

      const res = await fetch(\`\${API_URL}/registrar_asistencia_app.php\`, {
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
        Alert.alert("Atención", json.message || "No se pudo registrar la asistencia.", [
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
  };`
);

content = content.replace(
  /const iniciarCamara = async \(\) => \{[\s\S]*?\};/,
  `const iniciarCamara = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    
    // Solicitar ubicación al mismo tiempo
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError("Permiso de ubicación denegado.");
    } else {
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc);
      setLocationError(null);
    }

    setCameraActive(true);
    setScanned(false);
  };`
);

content = content.replace(
  /<Text style=\{styles\.footerText\}>\s*Verificando tu ubicación antes de habilitar el escaneo...\s*<\/Text>/,
  `{locationError ? (
          <Text style={[styles.footerText, { color: '#dc2626' }]}>{locationError}</Text>
        ) : location ? (
          <Text style={[styles.footerText, { color: '#16a34a' }]}>
            Ubicación obtenida ({location.coords.accuracy?.toFixed(0)}m de precisión)
          </Text>
        ) : cameraActive ? (
          <Text style={styles.footerText}>Obteniendo ubicación...</Text>
        ) : (
          <Text style={styles.footerText}>La ubicación se obtendrá al activar la cámara.</Text>
        )}`
);

content = content.replace(
  /\{scanned && \(\s*<View style=\{styles\.scannedOverlay\}>\s*<Ionicons name="checkmark-circle" size=\{60\} color="#16a34a" \/>\s*<Text style=\{\{ marginTop: 10, fontWeight: 'bold', color: '#16a34a' \}\}>¡Escaneado!<\/Text>\s*<\/View>\s*\)\}/,
  `{scanned && (
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
              )}`
);

content = content.replace(
  /<Text style=\{styles\.officeTextBold\}>OFICINA TEXCOCO<\/Text>/,
  `<Text style={styles.officeTextBold}>{userData?.oficina_nombre || "Tu Oficina"}</Text>`
);

fs.writeFileSync('src/app/scanner.tsx', content);
