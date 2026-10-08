import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    setScanned(true);
    alert(`¡Código escaneado!\nDatos: ${data}\n\n(Pronto esto registrará la asistencia)`);
  };

  const iniciarCamara = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    setCameraActive(true);
    setScanned(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear QR</Text>
        <View style={{ width: 24 }} /> {/* Espaciador invisible para centrar el título */}
      </View>

      <View style={styles.container}>
        
        {/* OFICINA ASIGNADA */}
        <View style={styles.officeBox}>
          <Ionicons name="business-outline" size={18} color="#475569" style={{ marginRight: 8 }} />
          <Text style={styles.officeTextNormal}>Oficina asignada: </Text>
          <Text style={styles.officeTextBold}>OFICINA TEXCOCO</Text>
        </View>

        <Text style={styles.instructionText}>
          Alinea el código QR de la oficina dentro del marco de lectura.
        </Text>

        {/* MARCO DE LA CÁMARA */}
        <View style={styles.cameraWrapper}>
          {/* Esquinas azules decorativas */}
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
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
              {scanned && (
                <View style={styles.scannedOverlay}>
                  <Ionicons name="checkmark-circle" size={60} color="#16a34a" />
                  <Text style={{ marginTop: 10, fontWeight: 'bold', color: '#16a34a' }}>¡Escaneado!</Text>
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
        <Text style={styles.footerText}>
          Verificando tu ubicación antes de habilitar el escaneo...
        </Text>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9', 
    justifyContent: 'space-between' 
  },
  backButton: { padding: 5, marginLeft: -5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  container: { flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#ffffff' },
  
  officeBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    marginBottom: 20 
  },
  officeTextNormal: { fontSize: 14, color: '#475569' },
  officeTextBold: { fontSize: 14, fontWeight: 'bold', color: '#0d6efd' },
  instructionText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 30, paddingHorizontal: 10 },
  
  cameraWrapper: { 
    width: 280, 
    height: 280, 
    position: 'relative', 
    marginBottom: 30 
  },
  cameraInner: { 
    flex: 1, 
    borderRadius: 20, 
    overflow: 'hidden', 
    margin: 15, 
    backgroundColor: '#000' 
  },
  cameraPlaceholder: { 
    flex: 1, 
    borderRadius: 20, 
    margin: 15, 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  cameraPlaceholderTitle: { color: '#94a3b8', marginTop: 15, fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  cameraPlaceholderText: { color: '#cbd5e1', marginTop: 5, fontSize: 12, textAlign: 'center' },
  
  scannedOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#0d6efd' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 20 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 20 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 20 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 20 },

  btnOutline: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '100%', 
    backgroundColor: '#ffffff', 
    borderWidth: 1, 
    borderColor: '#0d6efd', 
    borderRadius: 8, 
    paddingVertical: 14, 
    marginBottom: 20 
  },
  btnOutlineText: { color: '#0d6efd', fontSize: 16, fontWeight: '600' },
  btnPlaceholder: { height: 50, marginBottom: 20 }, 
  
  footerText: { fontSize: 13, color: '#94a3b8', textAlign: 'center' }
});
