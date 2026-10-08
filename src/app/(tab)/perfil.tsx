import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.100.9/UAEMex/wsl/Checador/backend/api';


export default function PerfilScreen() {
  const [perfilData, setPerfilData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const storedData = await SecureStore.getItemAsync('userData');
        if (storedData) {
          const user = JSON.parse(storedData);
          const res = await fetch(`${API_URL}/perfil_app.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: user.id })
          });
          const json = await res.json();
          if (json.success) {
            setPerfilData(json.perfil);
          }
        }
      } catch (e) {
        console.log('Error fetching profile:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, []);

  const handleLogout = async () => {
    // Borramos el token y regresamos al login
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    router.replace('/login' as any);
  };

  const userName = perfilData?.nombre || "Cargando...";
  const userEmail = perfilData?.correo || "Cargando...";
  const userRole = perfilData?.rol || "Colaborador";

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      )}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header (Título superior) */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi perfil</Text>
        </View>

        {/* Sección del Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarBox}>
            <Ionicons name="person" size={50} color="white" />
          </View>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>

        {/* Tarjeta de Información */}
        <View style={styles.card}>
          <InfoRow label="OFICINA" value={perfilData?.oficina || "--"} />
          <InfoRow label="ROL" value={userRole} />
          <InfoRow label="DÍAS LAB." value={perfilData?.dias_lab || "--"} />
          <InfoRow label="ENTRADA" value={perfilData?.entrada || "--"} />
          <InfoRow label="SALIDA" value={perfilData?.salida || "--"} />
          <InfoRow label="CREACIÓN" value={perfilData?.fecha_ingreso || "--"} noBorder />
        </View>

        {/* Tarjeta de Cerrar Sesión */}
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <View style={styles.logoutContent}>
            <Ionicons name="log-out-outline" size={24} color="#dc3545" style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={styles.logoutText}>Cerrar sesion</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// Componente reutilizable para cada fila de la tarjeta
function InfoRow({ label, value, noBorder }: { label: string, value: string, noBorder?: boolean }) {
  return (
    <View style={[styles.infoRow, !noBorder && styles.rowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 20 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 20,
    marginTop: 10 
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#0f172a' 
  },
  avatarSection: { 
    alignItems: 'center', 
    marginBottom: 30, 
    marginTop: 10 
  },
  avatarBox: {
    width: 100, 
    height: 100, 
    backgroundColor: '#1e293b', // Azul muy oscuro de tu diseño
    borderRadius: 30, // Bordes súper redondeados
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 15, 
    elevation: 5,
    marginBottom: 15
  },
  name: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#0f172a' 
  },
  email: { 
    fontSize: 16, 
    color: '#64748b', 
    marginTop: 4 
  },
  card: {
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', // Borde gris sutil
    paddingHorizontal: 20, 
    marginBottom: 20
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 18 
  },
  rowBorder: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  infoLabel: { 
    width: 90, 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#64748b', 
    letterSpacing: 0.5 
  },
  infoValue: { 
    flex: 1, 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#0f172a' 
  },
  logoutCard: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    padding: 20, 
    marginBottom: 40
  },
  logoutContent: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  logoutText: { 
    color: '#dc3545', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginLeft: 10 
  }
});